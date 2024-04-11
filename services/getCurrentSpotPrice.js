const GateApi = require('gate-api');
const client = require('./gateClient');

async function getCurrentSpotPrice(pair) {
  const spotApi = new GateApi.SpotApi(client);
  try {
    const opts = { limit: 2 }; // Only provide the limit parameter
    const { body: candlesticks } = await spotApi.listCandlesticks(pair, '1m', opts);
    const latestCandlestick = candlesticks[candlesticks.length - 1];
    if (!latestCandlestick) {
      console.error(`No candlestick data found for pair ${pair}`);
      return;
    }
    // console.log('Latest candlestick:', latestCandlestick); // Log the latest candlestick data
    return latestCandlestick[5]; // Get the close price
  } catch (error) {
    console.error(`Error fetching spot price for pair ${pair}:`, error);
  }
}
module.exports = getCurrentSpotPrice;

// // Usage
// setInterval(() => {
//   getCurrentSpotPrice('BTC_USDT')
//     .then(price => console.log('Current spot price:', price))
//     .catch(error => console.error('Error fetching spot price:', error));
// }, 1000); // 1000 milliseconds = 1 second