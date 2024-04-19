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
        
        // Create a spot order to sell the entire spot balance
        const order = new GateApi.Order();
        order.account = "spot";
        order.type = "market";
        order.currencyPair = pair; 
        order.amount = spotSize; 
        order.side = "sell";
        order.timeInForce = 'ioc';
        
        // Fetch the spot balance for the base currency of the pair
        const baseCurrency = pair.split('_')[0]; // Extract base currency from pair
        const spotBalance = await fetchSpotBalance(baseCurrency, subClientId);
        // Convert spotBalance.available and spotSize to numbers for comparison
        const availableSpotBalance = Number(spotBalance.available);
        const desiredSpotSize = Number(spotSize);

        // If available spot balance is less than the desired spot size, use the available spot balance
        if (availableSpotBalance < desiredSpotSize) {
            order.amount = spotBalance.available;
        }

        // Try to create the spot order
        spotApi.createOrder(order)
        .then(response => console.log('Spot sell order response', response.body))
        .catch(error => console.error(error.response));
        
        // Create a futures order to close the entire futures position
        const futuresOrder = new GateApi.FuturesOrder();
        futuresOrder.contract = pair;
        futuresOrder.settle = 'usdt';
        futuresOrder.size = -futuresSize;
        futuresOrder.price = '0'; // Market order  
        futuresOrder.tif = 'ioc'; 

        futuresApi.createFuturesOrder('usdt', futuresOrder)
            .then(response => console.log('Futures close order response', response.body))
            .catch(error => console.error(error.response));
        
       // Update the bots table
        await Bots.update({ isClose: true }, {
            where: {
                positionId: positionId
            }
        }); 
        return true;
    } catch (error) {
        console.error('Error during trading:', error);
        return false;
    }
}

module.exports = sellSpotAndLongFutures;
