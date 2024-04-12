const fetchSpotBalance = require('./fetchSpotBalance');
const fetchPosition = require('./getPosition');
const Bots = require('../models/BotsModel.js');
const cron = require('node-cron');
const sellSpotAndLongFutures = require('./closeTrades');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Function to check trades
async function checkTrades() {
  try {
    console.log('checkTrades function called');
    // Fetch all bots where isClose is false
    const bots = await Bots.findAll({ 
      attributes: ["userId", "matchingPairId", "currentPrice", "settle", "isClose"],
      where: { isClose: false } 
    });
    console.log('Bots fetched successfully', bots.length);
    // console.log(bots);
    for (const bot of bots) {
      // Fetch the spot balance for the pair
      const balance = await fetchSpotBalance(bot.matchingPairId, bot.userId);
      // Calculate balance in USDT
      const balanceInUsdt = balance.available * bot.currentPrice;
      // Fetch the futures position for the pair
      const position = await fetchPosition(bot.settle, bot.matchingPairId, bot.userId);
      console.log('Balance in USDT:', balanceInUsdt);
      // If the size of the futures position is less than 0 and balanceInUsdt is less than 1
      // or if balanceInUsdt is greater than 1 and size is 0
      if ((position.size < 0 && balanceInUsdt < 1) || (balanceInUsdt > 1 && position.size === 0)) {
        console.log('Exiting spot and futures');
        // Call sellSpotAndLongFutures with the matchingPairId from the bot
        try {
          await sellSpotAndLongFutures(bot.matchingPairId, bot.userId);
          console.log('Spot and futures exited successfully');
          await Bots.update({ isClose: true }, { where: { matchingPairId: bot.matchingPairId, userId: bot.userId } });
          console.log('Bots updated successfully');
        } catch (error) {
          console.error('Error during trading:', error);
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
