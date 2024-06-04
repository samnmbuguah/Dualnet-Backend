const fetchSpotBalance = require("./fetchSpotBalance");
const fetchPosition = require("./getPosition");
const Bots = require("../models/BotsModel.js");
const cron = require("node-cron");
const { closeShort, sellSpotPosition } = require("./checkCloseTrades");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Function to check trades
async function checkTrades() {
  try {
    console.log("checkTrades function called");
    const bots = await Bots.findAll({
      attributes: [
        "userId",
        "matchingPairId",
        "currentPrice",
        "settle",
        "isClose",
        "positionId",
        "quantoMultiplier",
        "futuresSize",
      ],
      where: { isClose: false },
    });
    console.log("Bots fetched successfully", bots.length);

    for (const bot of bots) {
      let balance = await fetchSpotBalance(bot.matchingPairId, bot.userId);
      balance = parseFloat(balance.available);
      const balanceInUsdt = balance * bot.currentPrice;
      const position = await fetchPosition(
        bot.settle,
        bot.matchingPairId,
        bot.userId
      );
      const positionSize =position ? position.size : 0; // Handle undefined position
      const futuresFullSize = -positionSize * bot.quantoMultiplier;

      // Calculate the percentage difference between futuresFullSize and balance
      const percentageDifference = Math.abs((futuresFullSize - balance) / balance) * 100;
      const closingSize = positionSize * -1;
      // If the percentage difference is greater than 5%, call sellSpotPosition and closeShort
      if (percentageDifference > 5) {
        console.log(
          "Selling spot and closing short due to percentage difference"
        );
        try {
          await sellSpotPosition(
            bot.matchingPairId,
            bot.userId,
            balance,
            bot.positionId
          );
          console.log("Spot sold successfully");

          await closeShort(
            bot.matchingPairId,
            bot.userId,
            closingSize,
            bot.positionId,
            bot.quantoMultiplier
          );
          console.log("Short closed successfully");
          return;
        } catch (error) {
          console.error("Error during selling spot and closing short:", error);
        }
      }

      if (positionSize < 0 && balanceInUsdt < 1) {
        console.log("Closing short");
        try {
          await closeShort(
            bot.matchingPairId,
            bot.userId,
            bot.futuresSize,
            bot.positionId,
            bot.quantoMultiplier
          );
          console.log("Short closed successfully");
        } catch (error) {
          console.error("Error during closing short:", error);
        }
      }

      if (balanceInUsdt > 1 && positionSize == 0) {
        console.log("Selling spot");
        try {
          await sellSpotPosition(
            bot.matchingPairId,
            bot.userId,
            balance,
            bot.positionId
          );
          console.log("Spot sold successfully");
        } catch (error) {
          console.error("Error during selling spot:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
  setTimeout(checkTrades, 1000);
}

module.exports = checkTrades;

// // Schedule the task to run every minute
// cron.schedule('* * * * *', checkTrades);
