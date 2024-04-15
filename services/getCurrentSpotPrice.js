const GateApi = require('gate-api');
const client = require('./gateClient');
const cron = require('node-cron');

async function getCurrentSpotPrice(pair) {
  const api = new GateApi.SpotApi(client);
  try {
    const opts = {
      'currencyPair': pair, 
      'timezone': "utc0" 
    };
    const { body: tickers } = await api.listTickers(opts);
    const ticker = tickers.find(t => t.currencyPair === pair);
    if (!ticker) {
      console.error(`No ticker found for pair ${pair}`);
      return;
    }
    // console.log('Ticker data:', ticker);
    return {
      currencyPair: ticker.currencyPair,
      last: ticker.last,
      lowestAsk: ticker.lowestAsk,
      highestBid: ticker.highestBid
    };
  } catch (error) {
    console.error(`Error fetching price for pair ${pair}:`, error);
  }
}

// Schedule the task to run at the top of every hour
// cron.schedule('* * * * *', () => {
//   getCurrentSpotPrice('BTC_USDT');
//   // getCurrentSpotPrice('ETH_USDT');
// });

module.exports = getCurrentSpotPrice;
