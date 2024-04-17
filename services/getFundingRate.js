const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const Scans = require('../models/ScansModel.js');
const cron = require('node-cron');

const api = new GateApi.FuturesApi(client);
const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency

const updateFundingRate = async () => {
    // Fetch all scans
    const scans = await Scans.findAll();

    // Update the fundingRate for each scan
    for (const scan of scans) {
        const contract = scan.matchingPairId; // Use the matchingPairId as the contract
        const opts = {
            'limit': 1 // number | Maximum number of records to be returned in a single list
        };

        try {
            const value = await api.listFuturesFundingRateHistory(settle, contract, opts);
            const fundingRate = parseFloat(value.body[0].r);
            // Update the fundingRate field
            await Scans.update({ fundingRate }, { where: { matchingPairId: contract } });
            console.log(`Updated fundingRate for ${contract} to ${fundingRate}`);
        } catch (error) {
            console.error(`Failed to update fundingRate for ${contract}: ${error}`);
        }
    }
};

// Schedule a cron job to run at the top of every hour
// cron.schedule('0 * * * *', updateFundingRate);

module.exports = updateFundingRate;