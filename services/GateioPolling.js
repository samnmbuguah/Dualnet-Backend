const Scans = require("../models/ScansModel.js");
const getContractDetails = require("./getContractDetails.js");
const getCurrentSpotPrice = require("./getCurrentSpotPrice");

// Helper function to handle rate limitting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class PollPrices {
  constructor(tickers, settle, amountPrecisions) {
    this.amountPrecisions = amountPrecisions;
    this.tickers = tickers;
    this.settle = settle;
    this.lastPrices = {};
  }

  updateTickers(tickers, amountPrecisions) {
    this.tickers = tickers;
    this.amountPrecisions = amountPrecisions;
  }

  async fetchAndUpdateScans() {
    const delayInMilliseconds = 10000 / 200; // 50 milliseconds

    for (let index = 0; index < this.tickers.length; index++) {
      const ticker = this.tickers[index];

      const startTime = Date.now();

      try {
        const spotResponse = await getCurrentSpotPrice(ticker);
        const futuresResponse = await getContractDetails(this.settle, ticker);

        const spotPrice = parseFloat(spotResponse.last);
        const futuresPrice = parseFloat(futuresResponse.lastPrice);

        let valueDifference = (futuresPrice - spotPrice).toFixed(
          this.amountPrecisions[index] + 2
        );
        let percentageDifference = (valueDifference / spotPrice) * 100;
        percentageDifference = parseFloat(percentageDifference.toFixed(4));

        await Scans.upsert({
          matchingPairId: ticker,
          futuresPrice: futuresPrice,
          spotPrice: spotPrice,
          valueDifference: valueDifference,
          percentageDifference: percentageDifference,
        });
        console.log(`Updated scan for ticker ${ticker}`);

      } catch (error) {
        console.error(`Failed to update scan for ticker ${ticker}: ${error}`);
      }

      const endTime = Date.now();
      const apiCallTime = endTime - startTime;

      const actualDelay = Math.max(0, delayInMilliseconds - apiCallTime);

      await delay(actualDelay);
    }

    console.log("All scans updated successfully");
    return true;
  }
}
module.exports = PollPrices;
