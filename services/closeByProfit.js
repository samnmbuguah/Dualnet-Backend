const sellSpotAndLongFutures = require("./closeTrades");
const fetchPosition = require("./getPosition");
const fetchSpotBalance = require("./fetchSpotBalance");
const Bots = require("../models/BotsModel.js");
const getCurrentSpotPrice = require("./getCurrentSpotPrice");
const listFuturesOrderBook = require("./listFuturesOrderBook.js");
const cron = require("node-cron");

async function closeByProfit(io, bots) {
  const botDataForUsers = {};

  // Iterate over each bot
  for (const bot of bots) {
    // Fetch current futures position and spot balance
    const currentFuturesPosition = await fetchPosition(
      bot.settle,
      bot.matchingPairId,
      bot.userId
    );
    const futuresResponse = await listFuturesOrderBook(bot.settle, bot.matchingPairId);
    const futuresPrice = parseFloat(futuresResponse.asks[0].p);
    const spotBalance = await fetchSpotBalance(bot.matchingPairId, bot.userId);
    let availableSpotBalance = parseFloat(spotBalance.available);

    let currentSpotData = await getCurrentSpotPrice(bot.matchingPairId);
    let currentSpotPrice = parseFloat(currentSpotData.highestBid);
    const spotSize = Math.min(
      Number(availableSpotBalance),
      Number(bot.spotSize)
    );

    // Calculate the current value of the spot trade and the futures position
    let currentSpotValue = currentSpotPrice * spotSize;
    let unrealisedPNL = Math.round((bot.futuresSize * (bot.futuresEntryPrice - futuresPrice)) * 10000) / 10000;
    let currentFuturesValue = bot.futuresValue + unrealisedPNL + bot.accumulatedFunding;

    // Calculate the PNL value for the bot
    const pnlValue = (currentSpotValue + currentFuturesValue) - bot.amountIncurred;
    const percentagePnl = (pnlValue / bot.amountIncurred) * 100;
    const highestProfit = percentagePnl > bot.highestProfit ? percentagePnl : bot.highestProfit;
    let currentDifference = ((futuresPrice - currentSpotPrice) / currentSpotPrice) * 100;

    // Emit the bot data
    let botData = {
      matchingPairId: bot.matchingPairId,
      leverage: bot.leverage,
      amountIncurred: bot.amountIncurred,
      pnlValue: pnlValue,
      percentagePnl: percentagePnl,
      profitThreshold: bot.profitThreshold,
      futuresSize: bot.futuresSize,
      spotSize: spotSize,
      positionId: bot.positionId,
      createdAt: bot.createdAt,
      quantoMultiplier: bot.quantoMultiplier,
      currentSpotPrice: currentSpotPrice,
      currentFuturesPrice: futuresPrice,
      openingDifference: bot.openingDifference,
      currentDifference: currentDifference,
      pnlPercent: percentagePnl,
      unrealisedPnl: pnlValue,
      adl: currentFuturesPosition.adlRanking,
      highestProfit: highestProfit,
      closeByProfit: bot.profitThreshold,
      spotEntryPrice: bot.spotEntryPrice,
      futuresEntryPrice: bot.futuresEntryPrice,
      closeByDeviation: bot.closeByDeviation,
    };

    // Add botData to the array for this user
    if (!botDataForUsers[bot.userId]) {
      botDataForUsers[bot.userId] = [];
    }

    if (percentagePnl > bot.profitThreshold || currentDifference > bot.closeByDeviation) {
      const reason = `Profit threshold of ${bot.profitThreshold} reached or deviation of ${bot.closeByDeviation} reached.`;
      await sellSpotAndLongFutures(
        bot.matchingPairId,
        bot.userId,
        bot.futuresSize,
        spotSize,
        bot.positionId,
        bot.quantoMultiplier,
        reason
      );
    } else {
      // Update the bot in the database
      await bot.update({
        currentSpotPrice: currentSpotPrice,
        currentFuturesPrice: futuresPrice,
        currentDifference: currentDifference,
        pnlPercent: percentagePnl,
        unrealisedPnl: pnlValue,
        adl: currentFuturesPosition.adlRanking,
        highestProfit: highestProfit,
      });

      botDataForUsers[bot.userId].push(botData);
    }
  }

  // Emit botData for each user
  for (const userId in botDataForUsers) {
    const userIdInt = parseInt(userId, 10);
    io.to(userIdInt).emit("botData", botDataForUsers[userId]);
    // console.log("botDataForUsers", botDataForUsers[userId])
  }
}
module.exports = closeByProfit;
 