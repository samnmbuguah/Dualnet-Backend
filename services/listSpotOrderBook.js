const GateApi = require('gate-api');
const client = require('./gateClient.js');

const api = new GateApi.SpotApi(client);

async function listOrderBook(currencyPair, opts) {
    return api.listOrderBook(currencyPair, opts)
        .then(value => {
            const lowestAsk = value.body.asks[0];
            // console.log('Lowest ask: ', lowestAsk);
            return lowestAsk;
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
}

module.exports = listOrderBook;


// async function main() {
//     const currencyPair = "BTC_USDT"; // string | Spot currency pair
//     const opts = {
//         'limit': 1, // number | Maximum number of order depth data in asks or bids
//     };

//     const spotPrice = await listOrderBook(currencyPair, opts);
//     console.log('Spot price: ', spotPrice[0]);
// }

// main().catch(console.error);