const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const Scans = require('../models/ScansModel.js');
const cron = require('node-cron');
const settle = "usdt";

const updateFundingRate = async () => {
    try {
        console.log('Fetching futures contracts...');
        const futuresApi = new GateApi.FuturesApi(client);
        
        const value = await futuresApi.listFuturesContracts(settle);
        const contracts = value.body;
        for (const contract of contracts) {
            const fundingRate = parseFloat(contract.fundingRate);
            // Update the fundingRate field
            await Scans.update({ fundingRate }, { where: { matchingPairId: contract.name } });
            console.log(`Updated fundingRate for ${contract.name} to ${fundingRate}`);
        }
    } catch (error) {
        console.error(`Failed to update funding rates: ${error}`);
    }
};

// Schedule a cron job to run at the top of every hour
// cron.schedule('0 * * * *', updateFundingRate);

// updateFundingRate()
module.exports = updateFundingRate;