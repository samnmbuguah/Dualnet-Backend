require('dotenv').config();
const GateApi = require('gate-api');
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const client = new GateApi.ApiClient();
client.setApiKeySecret(apiKey, apiSecret);
const spotApi = new GateApi.SpotApi(client);
const futuresApi = new GateApi.FuturesApi(client);
const Scans = require('../models/ScansModel.js');
const listFuturesOrderBook = require('./listFuturesOrderBook.js');
const listOrderBook = require('./listSpotOrderBook.js');

class PollPrices {
    constructor(tickers, settle, amountPrecisions) {
        this.amountPrecisions = amountPrecisions;
        this.tickers = tickers;
        this.settle = settle;
        this.lastPrices = {};
    }

   async fetchAndUpdateScans() {
    const promises = this.tickers.map(async (ticker, index) => {
        try {
            const spotResponse = await listOrderBook(ticker, { limit: 1 });
            const futuresResponse = await listFuturesOrderBook(this.settle, ticker, { limit: 1 });

            const spotPrice = parseFloat(spotResponse[0]);
            const futuresPrice = parseFloat(futuresResponse.p);

            let valueDifference = futuresPrice - spotPrice;
            valueDifference = parseFloat(valueDifference.toFixed(this.amountPrecisions[index]));
            let percentageDifference = ((futuresPrice - spotPrice) / spotPrice) * 100;
            percentageDifference = parseFloat(percentageDifference.toFixed(4));

            await Scans.upsert({
                matchingPairId: ticker,
                futuresPrice: futuresPrice,
                spotPrice: spotPrice,
                valueDifference: valueDifference,
                percentageDifference: percentageDifference
            });
            console.log("Upserted ", ticker, " with futures price ", futuresPrice, " and spot price ", spotPrice, " and percentage difference ", percentageDifference);
            // console.log(`Scan for ticker ${ticker} updated successfully`);
        } catch (error) {
            console.error(`Failed to update scan for ticker ${ticker}: ${error}`);
        }
    });

    await Promise.allSettled(promises);

    return 'Top scans updated in the database';
}
}
module.exports = PollPrices;