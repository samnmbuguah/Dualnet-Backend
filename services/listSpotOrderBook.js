const GateApi = require('gate-api');
const client = require('./gateClient.js');

const api = new GateApi.SpotApi(client);

function listOrderBook(currencyPair, opts) {
    return api.listOrderBook(currencyPair, opts)
        .then(value => {
            const firstAsk = value.body.asks[0];
            console.log('API called successfully');
            console.log('First ask: ', firstAsk);
            return firstAsk;
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
}

module.exports = listOrderBook;


// const currencyPair = "BTC_USDT"; // string | Spot currency pair
// const opts = {
//   'limit': 1, // number | Maximum number of order depth data in asks or bids
// };

// listOrderBook(currencyPair, opts);