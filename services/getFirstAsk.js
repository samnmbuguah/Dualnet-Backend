const GateApi = require('gate-api');
const client = require('./gateClient');


const api = new GateApi.SpotApi(client);
async function getFirstAsk(pair) {
    try {
        const response = await api.listOrderBook(pair);
        // console.log(`Order book for ${pair}:`, response.body);
        const firstAsk = response.body.asks[0][0];
        console.log(`First ask price for ${pair}: ${firstAsk}`);
        return firstAsk;
    } catch (error) {
        console.error(`Error getting first ask price for ${pair}: ${error}`);
    }
}
module.exports = getFirstAsk;

// // Call the function
// getFirstAsk('MOVEZ_USDT'); // replace 'btc_usdt' with your currency pair