const Scans = require('../models/ScansModel.js');
const getContractDetails = require('./getContractDetails.js');
const getCurrentSpotPrice = require('./getCurrentSpotPrice');

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
            const spotResponse = await getCurrentSpotPrice(ticker);
            const futuresResponse =  await getContractDetails(this.settle, ticker);

            const spotPrice = parseFloat(spotResponse.last);
            const futuresPrice = parseFloat(futuresResponse.lastPrice);

            
            let valueDifference = (futuresPrice - spotPrice).toFixed(this.amountPrecisions[index] + 2);
            let percentageDifference = (valueDifference / spotPrice) * 100;
            percentageDifference = parseFloat(percentageDifference.toFixed(4));

            await Scans.upsert({
                matchingPairId: ticker,
                futuresPrice: futuresPrice,
                spotPrice: spotPrice,
                valueDifference: valueDifference,
                percentageDifference: percentageDifference
            });
            // console.log("Upserted ", ticker, " with futures price ", futuresPrice, " and spot price ", spotPrice, " and percentage difference ", percentageDifference);
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