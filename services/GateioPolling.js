require('dotenv').config();
const GateApi = require('gate-api');
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const client = new GateApi.ApiClient();
client.setApiKeySecret(apiKey, apiSecret);
const spotApi = new GateApi.SpotApi(client);
const futuresApi = new GateApi.FuturesApi(client);
const Scans = require('../models/ScansModel.js');

class PollPrices {
    constructor(tickers, settle, amountPrecisions) {
        this.amountPrecisions = amountPrecisions;
        this.tickers = tickers;
        this.settle = settle;
        this.lastPrices = {};
    }

    async fetchAndUpdateScans() {
        const promises = this.tickers.map(async (ticker, index) => {
            const spotResponse = await spotApi.listCandlesticks(ticker, { interval: '1m', limit: 1 });
            const futuresResponse = await futuresApi.listFuturesCandlesticks(this.settle, ticker, { interval: '1m', limit: 1 });

            const spotPrice = spotResponse.body[0][4];
            // console.log(`Spot price for ${ticker}: ${spotPrice}`);
            const futuresPrice = futuresResponse.body[0].c;
            // console.log(`Futures price for ${ticker}: ${futuresPrice}`);

            let valueDifference = futuresPrice - spotPrice;
            valueDifference = parseFloat(valueDifference.toFixed(this.amountPrecisions[index]));
            let percentageDifference = ((futuresPrice - spotPrice) / spotPrice) * 100;
            percentageDifference = parseFloat(percentageDifference.toFixed(4));

            return Scans.upsert({
                matchingPairId: ticker,
                futuresPrice: futuresPrice,
                spotPrice: spotPrice,
                valueDifference: valueDifference,
                percentageDifference: percentageDifference
            });
        });

        const results = await Promise.allSettled(promises);
        let hasError = false;

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to update scan for ticker ${this.tickers[index]}: ${result.reason}`);
                hasError = true;
            }
        });

        console.log('Top scans updated in the database');

        return hasError ? 'Error occurred while updating scans' : 'Scans updated successfully';
    }
}
module.exports = PollPrices;