const sellSpotAndLongFutures = require("./closeTrades");
const fetchPosition = require("./getPosition");
const fetchSpotBalance = require("./fetchSpotBalance");
const Bots = require("../models/BotsModel.js");
const getCurrentSpotPrice = require("./getCurrentSpotPrice");
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
    let unrealisedPNL = Math.round((bot.futuresSize * (bot.futuresEntryPrice - parseFloat(currentFuturesPosition.markPrice))) * 10000) / 10000;
    let currentFuturesValue = bot.futuresValue + unrealisedPNL; ;

    // Calculate the PNL value for the bot
    const pnlValue = currentSpotValue + currentFuturesValue - bot.amountIncurred;
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
      futuresSize: bot.futuresSize,
      spotSize: spotSize,
      positionId: bot.positionId,
      createdAt: bot.createdAt,
      quantoMultiplier: bot.quantoMultiplier,
    };

    // Add botData to the array for this user
    if (!botDataForUsers[bot.userId]) {
      botDataForUsers[bot.userId] = [];
    }

    if (percentagePnl > bot.profitThreshold) {
      await sellSpotAndLongFutures(
        bot.matchingPairId,
        bot.userId,
        bot.futuresSize,
        spotSize,
        bot.positionId,
        bot.quantoMultiplier,
      );
    } else {
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
