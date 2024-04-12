const sellSpotAndLongFutures = require('./closeTrades');
const fetchPosition = require('./getPosition');
const fetchSpotBalance = require('./fetchSpotBalance');
const Bots = require('../models/BotsModel.js');
const getCurrentSpotPrice = require('./getCurrentSpotPrice');
const cron = require('node-cron');

const closeByProfitThreshold = 1.3; // 1.3%

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
                bots: []
            };
        }
        acc[key].amountIncurred += bot.amountIncurred;
        acc[key].bots.push(bot);
        return acc;
    }, {});
    console.log("completed Grouping of bots", groupedBots)
    // Iterate over each group of bots
    for (const key in groupedBots) {
        const group = groupedBots[key];

        const currentFuturesPosition = await fetchPosition(group.settle, group.matchingPairId, group.userId);
        const spotBalance = await fetchSpotBalance(group.matchingPairId, group.userId);
        let availableSpotBalance = parseFloat(spotBalance.available);

        let currentSpotPrice = parseFloat(await getCurrentSpotPrice(group.matchingPairId));

        // Calculate the current value of the spot trade and the futures position
        let currentSpotValue = currentSpotPrice * availableSpotBalance;
        let currentFuturesValue = ((-currentFuturesPosition.size) * parseFloat(currentFuturesPosition.markPrice) * group.quantoMultiplier) + parseFloat(currentFuturesPosition.unrealisedPnl);

        // Calculate the PNL value and the percentage PNL
        const pnlValue = (currentSpotValue + currentFuturesValue) - group.amountIncurred;
        const percentagePnl = (pnlValue / group.amountIncurred) * 100;

        // Emit the bot data
        let botData= {
            matchingPairId: group.matchingPairId,
            leverage: group.leverage,
            amountIncurred: group.amountIncurred,
            pnlValue: pnlValue,
            percentagePnl: percentagePnl,
            liqPrice: currentFuturesPosition.liqPrice
        }
        
        io.to(group.userId).emit('botData', botData);
        // If the percentage PNL is greater than the close by profit threshold, close the trade
        if (percentagePnl > closeByProfitThreshold) {
            sellSpotAndLongFutures(group.matchingPairId, group.userId);
            // Update the isClose field of the bots in the group
            for (const bot of group.bots) {
                await bot.update({ isClose: true });
            }
        }
    }
}


module.exports = closeByProfit;



