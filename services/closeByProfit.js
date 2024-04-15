const sellSpotAndLongFutures = require('./closeTrades');
const fetchPosition = require('./getPosition');
const fetchSpotBalance = require('./fetchSpotBalance');
const Bots = require('../models/BotsModel.js');
const getCurrentSpotPrice = require('./getCurrentSpotPrice');
const cron = require('node-cron');

async function closeByProfit(io, bots) {
    // Group bots by userId and matchingPairId and aggregate amountIncurred
    const groupedBots = bots.reduce((acc, bot) => {
        const key = `${bot.matchingPairId}-${bot.userId}`;
        if (!acc[key]) {
            acc[key] = {
                matchingPairId: bot.matchingPairId,
                userId: bot.userId,
                amountIncurred: 0,
                leverage: bot.leverage,
                settle: bot.settle,
                quantoMultiplier: bot.quantoMultiplier,
                profitThreshold: bot.profitThreshold,
                bots: []
            };
        }
        acc[key].amountIncurred += bot.amountIncurred;
        acc[key].bots.push(bot);
        return acc;
    }, {});

    const botDataForUsers = {};

    console.log("completed Grouping of bots", groupedBots)
    // Iterate over each group of bots
    for (const key in groupedBots) {
        const group = groupedBots[key];

        // Fetch current futures position and spot balance
        const currentFuturesPosition = await fetchPosition(group.settle, group.matchingPairId, group.userId);
        const spotBalance = await fetchSpotBalance(group.matchingPairId, group.userId);
        let availableSpotBalance = parseFloat(spotBalance.available);

        let currentSpotData = await getCurrentSpotPrice(group.matchingPairId);
        let currentSpotPrice = parseFloat(currentSpotData.last);
        
        // Calculate the current value of the spot trade and the futures position
        let currentSpotValue = currentSpotPrice * availableSpotBalance;
        let currentFuturesValue = ((-currentFuturesPosition.size) * parseFloat(currentFuturesPosition.markPrice) * group.quantoMultiplier) + parseFloat(currentFuturesPosition.unrealisedPnl);

        // Calculate the total PNL value for the group
        const totalPnlValue = (currentSpotValue + currentFuturesValue) - group.amountIncurred;

        // If botDataForUsers for this user doesn't exist, create it
        if (!botDataForUsers[group.userId]) {
            botDataForUsers[group.userId] = [];
        }

        // Iterate over each bot in the group
        for (const bot of group.bots) {
            // Calculate the PNL value for the bot based on its contribution to the total amountIncurred
            const pnlValue = totalPnlValue * (bot.amountIncurred / group.amountIncurred);
            const percentagePnl = (pnlValue / bot.amountIncurred) * 100;

            // Emit the bot data
            let botData = {
                matchingPairId: bot.matchingPairId,
                leverage: bot.leverage,
                amountIncurred: bot.amountIncurred,
                pnlValue: pnlValue,
                percentagePnl: percentagePnl,
                liqPrice: currentFuturesPosition.liqPrice,
                profitThreshold: bot.profitThreshold,
            }

            // Add botData to the array for this user
            botDataForUsers[group.userId].push(botData);
        }

        // If the total percentage PNL is greater than the close by profit threshold, close the trade
        if ((totalPnlValue / group.amountIncurred) * 100 > group.profitThreshold) {
            sellSpotAndLongFutures(group.matchingPairId, group.userId);
            // Update the isClose field of the bots in the group
            for (const bot of group.bots) {
                await bot.update({ isClose: true });
            }
        }
    }

    // Emit botData for each user
    for (const userId in botDataForUsers) {
        const userIdInt = parseInt(userId, 10);
        io.to(userIdInt).emit('botData', botDataForUsers[userId]);
        console.log("botDataForUsers", botDataForUsers[userId])
    }
}
module.exports = closeByProfit;
