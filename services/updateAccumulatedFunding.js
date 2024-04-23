const Bots = require('../models/BotsModel.js');
const Scans = require('../models/ScansModel.js');
const updateFundingRate = require('./getFundingRate.js')
const cron = require('node-cron');

const updateAccumulatedFunding = async () => {
    try {
        console.log('Updating Accumulated Funding...');
        // Update the funding rates
        await updateFundingRate();
        
        // Get all open bots
        const bots = await Bots.findAll({ where: { isClose: false } });
        
        for (const bot of bots) {
            // Get the corresponding funding rate
            const scan = await Scans.findOne({ where: { matchingPairId: bot.matchingPairId } });
            const fundingRate = scan ? scan.fundingRate : 0;

            // Calculate the funding rate fee and add it to the accumulated funding
            const fundingRateFee = bot.futuresValue * fundingRate/100;
            bot.accumulatedFunding += fundingRateFee;

            // Update the bot in the database
            await bot.save();
        }

        console.log('Accumulated Funding updated successfully');
    } catch (error) {
        console.error(`Failed to update accumulated funding: ${error}`);
    }
};

// // Schedule the function to run every 8 hours from the beginning of the day
// cron.schedule('0 */8 * * *', updateAccumulatedFunding);

// updateAccumulatedFunding();

module.exports = updateAccumulatedFunding;