const sellSpotAndLongFutures = require('./closeTrades');
const fetchPosition = require('./getPosition');
const fetchSpotBalance = require('./fetchSpotBalance');
const Bots = require('../models/BotsModel.js');
const getCurrentSpotPrice = require('./getCurrentSpotPrice');
const cron = require('node-cron');

const closeByProfitThreshold = 1.3; // 1.3%


async function closeByProfit(io,bots) {

    for (const bot of bots) {
        const currentFuturesPosition = await fetchPosition(bot.settle, bot.matchingPairId);
        const spotBalance = await fetchSpotBalance(bot.matchingPairId, bot.userId);
        let availableSpotBalance = parseFloat(spotBalance.available);
    
        let currentSpotPrice = parseFloat(await getCurrentSpotPrice(bot.matchingPairId));
    
        // Calculate the current value of the spot trade and the futures position
        let currentSpotValue = currentSpotPrice * availableSpotBalance;
        let currentFuturesValue = ((-currentFuturesPosition.size) * parseFloat(currentFuturesPosition.markPrice) * bot.quantoMultiplier) + parseFloat(currentFuturesPosition.unrealisedPnl);

        // Calculate the PNL value and the percentage PNL
        const pnlValue = (currentSpotValue + currentFuturesValue) - bot.amountIncurred;
        const percentagePnl = (pnlValue / bot.amountIncurred) * 100;
    
        // Emit the bot data
        io.emit('botData', {
            matchingPairId: bot.matchingPairId,
            leverage: bot.leverage,
            amountIncurred: bot.amountIncurred,
            pnlValue: pnlValue,
            percentagePnl: percentagePnl,
            liqPrice: currentFuturesPosition.liqPrice
        });
        
        // If the percentage PNL is greater than the close by profit threshold, close the trade
        if (percentagePnl > closeByProfitThreshold) {
            sellSpotAndLongFutures(bot.matchingPairId, bot.userId);
            // Update the isClose field of the bot
            await bot.update({ isClose: true });
        }
    }
}


module.exports = closeByProfit;



