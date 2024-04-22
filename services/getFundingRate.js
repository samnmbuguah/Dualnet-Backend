const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const Scans = require('../models/ScansModel.js');
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
            // Update the fundingRate field
            await Scans.update({ fundingRate: newFundingRate }, { where: { matchingPairId: contract.name } });
        }
        console.log('Funding Rates updated successfully');
    } catch (error) {
        console.error(`Failed to update funding rates: ${error}`);
    }
};

// // Schedule a cron job to run at the top of every hour
// cron.schedule('0 * * * *', updateFundingRate);

// updateFundingRate()
module.exports = updateFundingRate;