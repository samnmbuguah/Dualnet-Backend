const GateApi = require('gate-api');
const client = require('./gateClient.js');

const api = new GateApi.FuturesApi(client);

async function listFuturesOrderBook(settle, contract, opts) {
    return api.listFuturesOrderBook(settle, contract, opts)
        .then(value => {
            // console.log('API called successfully. Returned data: ', value.body);
            const firstBid = value.body.bids[0];
            // console.log('First bid: ', firstBid.p);
            return firstBid;
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
}

module.exports = listFuturesOrderBook;


// async function main() {
//     const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency
//     const contract = "BTC_USDT"; // string | Futures contract
//     const opts = {
//         'interval': '0', // '0' | '0.1' | '0.01' | Order depth. 0 means no aggregation is applied. default to 0
//         'limit': 1, // number | Maximum number of order depth data in asks or bids
//         'withId': false // boolean | Whether the order book update ID will be returned. This ID increases by 1 on every order book update
//     };

//     const futuresPrice = await listFuturesOrderBook(settle, contract, opts);
//     console.log('Futures price: ', futuresPrice.p);
// }

// main().catch(console.error);


