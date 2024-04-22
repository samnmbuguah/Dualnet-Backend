const fetchSpotBalance = require('./fetchSpotBalance');
const fetchPosition = require('./getPosition');
const Bots = require('../models/BotsModel.js');
const cron = require('node-cron');
const { closeShort, sellSpotPosition } = require('./checkCloseTrades');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Function to check trades
async function checkTrades() {
  try {
    console.log('checkTrades function called');
    const bots = await Bots.findAll({ 
      attributes: ["userId", "matchingPairId", "currentPrice", "settle", "isClose", "positionId", "quantoMultiplier"],
      where: { isClose: false } 
    });
    console.log('Bots fetched successfully', bots.length);

    for (const bot of bots) {
      const balance = await fetchSpotBalance(bot.matchingPairId, bot.userId);
      const balanceInUsdt = balance.available * bot.currentPrice;
      const position = await fetchPosition(bot.settle, bot.matchingPairId, bot.userId);
      const positionSize = position ? position.size : 0; // Handle undefined position

      if (positionSize < 0 && balanceInUsdt < 1) {
        console.log('Closing short');
        try {
          await closeShort(bot.matchingPairId, bot.userId, positionSize, bot.positionId, bot.quantoMultiplier);
          console.log('Short closed successfully');
        } catch (error) {
          console.error('Error during closing short:', error);
        }
      }

      if (balanceInUsdt > 1 && positionSize == 0) {
        console.log('Selling spot');
        try {
          await sellSpotPosition(bot.matchingPairId, bot.userId, balance, bot.positionId);
          console.log('Spot sold successfully');
          await Bots.update({ isClose: true }, { where: { matchingPairId: bot.matchingPairId, userId: bot.userId } });
          console.log('Bots updated successfully');
        } catch (error) {
          console.error('Error during selling spot:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
}

module.exports = checkTrades;

// // Schedule the task to run every minute
// cron.schedule('* * * * *', checkTrades);
