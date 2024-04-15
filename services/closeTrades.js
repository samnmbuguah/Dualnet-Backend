const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const Bots = require('../models/BotsModel.js');
const fetchSpotBalance = require('./fetchSpotBalance');
const getApiCredentials = require('./getApiCredentials');

async function sellSpotAndLongFutures(pair, subClientId, futuresSize = 0, spotSize, positionId) {
    try {
        const credentials = await getApiCredentials(subClientId);
        if (!credentials) {
            throw new Error('Could not fetch API credentials. Aborting trade.');
        }
        
        client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);
        
        const spotApi = new GateApi.SpotApi(client);
        const futuresApi = new GateApi.FuturesApi(client);
        // Fetch the spot balance for the base currency of the pair
        const baseCurrency = pair.split('_')[0]; // Extract base currency from pair
        const spotBalance = await fetchSpotBalance(baseCurrency, subClientId);
        if (!spotBalance) {
            console.error(`No spot balance found for ${baseCurrency}`);
            return;
        }

        // Create a spot order to sell the entire spot balance
        const order = new GateApi.Order();
        order.account = "spot";
        order.type = "market";
        order.currencyPair = pair; 
        order.amount = spotSize; // The full amount
        order.side = "sell"; // Sell the spot balance
        order.timeInForce = 'ioc';

        // Try to create the spot order
        const response = await spotApi.createOrder(order);
        console.log('Spot close order response', response.body);

        // Create a futures order to close the entire futures position
        const futuresOrder = new GateApi.FuturesOrder();
        futuresOrder.contract = pair;
        futuresOrder.settle = 'usdt';
        futuresOrder.size = -futuresSize;// Close the entire position
        futuresOrder.price = '0'; // Market order  
        futuresOrder.tif = 'ioc'; // Time in force

        futuresApi.createFuturesOrder('usdt', futuresOrder)
            .then(response => console.log('Futures close order response', response.body))
            .catch(error => console.error(error.response));
        
       // Update the bots table
        await Bots.update({ isClose: true }, {
            where: {
                positionId: positionId
            }
        }); 
    } catch (error) {
        console.error('Error during trading:', error);
    }
}

module.exports = sellSpotAndLongFutures;
