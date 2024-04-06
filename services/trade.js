const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const getFirstAsk = require('./getFirstAsk');
const getApiCredentials = require('./getApiCredentials');

let spotOrderId;
let futuresOrderId;

function createSpotBuyOrder(pair, amount) {
    const spotApi = new GateApi.SpotApi(client);
    console.log('Creating spot buy order...');
    const order = new GateApi.Order();
    order.account = 'spot'; 
    order.currencyPair = pair;
    order.amount = amount;
    order.side = 'buy';
    order.type = 'market'; 
    order.timeInForce = 'fok'; // Fill or kill
    
    return spotApi.createOrder(order)
    .then(response => {
        spotOrderId = response.body.id;
        console.log('Spot buy order created', response.body);
    })
    .catch(error => console.error(error.response.data));
}

function createFuturesShortOrder(settle, contract, size) {
    const futuresApi = new GateApi.FuturesApi(client);
    console.log('Creating futures short order...');
    const futuresOrder = new GateApi.FuturesOrder();
    futuresOrder.contract = contract;
    futuresOrder.size = size;
    futuresOrder.price = '0'; // Order price. 0 for market order with tif set as ioc
    futuresOrder.tif = 'ioc'; // Time in force
    futuresOrder.reduce_only = false; // Set as true to be reduce-only order
    futuresOrder.close = false; 

    return futuresApi.createFuturesOrder(settle, futuresOrder)
        .then(response => {
            futuresOrderId = response.body.id;
            console.log('Futures short order created', response.body);
        })
        .catch(error => {
            console.error(error.response.data);
            throw error; // Throw the error to stop execution
        });
    }
    
async function trade(pair, amount, lastPrice, quantoMultiplier, takerFeeRate, subClientId) {
    let firstAskPrice;
    try {
        const credentials = await getApiCredentials(subClientId);
        if (!credentials) {
            throw new Error('Could not fetch API credentials. Aborting trade.');
        }

        client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);
        firstAskPrice =  await getFirstAsk(pair);
    } catch (error) {
        console.error(error.message);
        return;
    }

    try {
        const contracts = Math.floor(amount / (lastPrice * quantoMultiplier));
        let spotAmount = contracts * quantoMultiplier * firstAskPrice; 
        spotAmount = spotAmount + (spotAmount * takerFeeRate); 
        console.log('Spot amount:', spotAmount);
        console.log('Contracts:', contracts);
        await createFuturesShortOrder('usdt', pair, contracts);
        await createSpotBuyOrder(pair, spotAmount);
    } catch (error) {
        console.error('Error in trade:', error.response ? error.response.data : error);
    }
}

module.exports = trade;
