const GateApi = require('gate-api');
const client = require('./gateClient');
const fetchPosition = require('./getPosition');
const fetchSpotBalance = require('./fetchSpotBalance');
const spotApi = new GateApi.SpotApi(client);
const futuresApi = new GateApi.FuturesApi(client);

async function sellSpotAndLongFutures(pair) {
    // Fetch the spot balance for the base currency of the pair
    const baseCurrency = pair.split('_')[0]; // Extract base currency from pair
    const spotBalance = await fetchSpotBalance(baseCurrency);
    if (!spotBalance) {
        console.error(`No spot balance found for ${baseCurrency}`);
        return;
    }

    // Create a spot order to sell the entire spot balance
    const order = new GateApi.Order();
    order.account = "spot"
    order.type = "market"
    order.currencyPair = pair; 
    order.amount = spotBalance.available; // The full amount
    order.side = "sell"; // Sell the spot balance
    order.timeInForce = 'ioc'

    if (spotBalance.available >= 3) {
        try {
            const response = await spotApi.createOrder(order);
            console.log('Spot order created', response.body);
        } catch (error) {
            console.error(error);
        }
    }
    
    // Create a futures order to close the entire futures position
    const futuresOrder = new GateApi.FuturesOrder();
    futuresOrder.contract = pair;
    futuresOrder.size = 0;// Close the entire position
    futuresOrder.price = '0'; // Market order
    futuresOrder.close = true;
    futuresOrder.tif = 'ioc'; // Time in force

    futuresApi.createFuturesOrder('usdt', futuresOrder)
    .then(response => console.log('Futures order created', response.body))
    .catch(error => console.error(error.response));
}

module.exports = sellSpotAndLongFutures;

// Call the function
sellSpotAndLongFutures('MOVEZ_USDT')
    .then(() => console.log('Spot and futures orders created'))
    .catch(error => console.error('Error during trading:', error));