const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const Scans = require('../models/ScansModel.js');
const Bots = require('../models/BotsModel.js');
const sellSpotAndLongFutures = require('./closeTrades.js');
const fetchSpotBalance = require("./fetchSpotBalance");
const cron = require('node-cron');
const settle = "usdt";

const updateFundingRate = async () => {
    try {
        console.log('Updating Funding Rates...');
        const futuresApi = new GateApi.FuturesApi(client);
        
        const value = await futuresApi.listFuturesContracts(settle);
        const contracts = value.body;
        for (const contract of contracts) {
            const newFundingRate = parseFloat((contract.fundingRate * 100).toFixed(6));
            const fundingNextApply = contract.fundingNextApply;
            // Update the fundingRate and fundingNextApply fields
            await Scans.update({ fundingRate: newFundingRate, fundingNextApply: fundingNextApply }, { where: { matchingPairId: contract.name } });
        }
        console.log('Funding Rates updated successfully');
        
        // Fetch all open bots
        // const openBots = await Bots.findAll({ where: { isClose: false } });

        // for (const bot of openBots) {
        
        // Fetch all open bots
        // const openBots = await Bots.findAll({ where: { isClose: false } });

        // for (const bot of openBots) {
        //     // Fetch the funding rate for the bot's matching pair ID
        //     const scan = await Scans.findOne({
        //     where: { matchingPairId: bot.matchingPairId },
        //     });

        //     // If the funding rate is less than 0, call sellSpotAndLongFutures with the correct parameters
        //     if (scan && scan.fundingRate < 0) {
        //         const spotBalance = await fetchSpotBalance(
        //             bot.matchingPairId,
        //             bot.userId
        //         );
        //         let availableSpotBalance = parseFloat(spotBalance.available);
        //         const spotSize = Math.min(
        //             Number(availableSpotBalance),
        //             Number(bot.spotSize)
        //         );
        //         await sellSpotAndLongFutures(
        //         bot.matchingPairId, // pair
        //         bot.userId, // subClientId
        //         bot.futuresSize || 0, // futuresSize
        //         spotSize, // spotSize
        //         bot.positionId, // positionId
        //         bot.quantoMultiplier, // multiplier
        //         "Negative funding rate" // reason
        //         );
        //     }
        // }
    } catch (error) {
        console.error(`Failed to update funding rates: ${error}`);
    }
};

// // Schedule a cron job to run at the top of every hour
// cron.schedule('0 * * * *', updateFundingRate);

// updateFundingRate()
module.exports = updateFundingRate;
