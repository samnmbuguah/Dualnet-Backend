const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const getFirstAsk = require('./getFirstAsk');
const getApiCredentials = require('./getApiCredentials');
const Bots = require('../models/BotsModel.js');
const uuid = require('uuid');

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
    order.timeInForce = 'fok';
    
    return spotApi.createOrder(order)
    .then(response => {
        spotOrderId = response.body.id;
        console.log('Spot buy order created', response.body);
        return response.body;
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
            return response.body;
        })
        .catch(error => {
            console.error(error.response);
            throw error; // Throw the error to stop execution 
        });
    }
    
async function trade(pair, amount, lastPrice, quantoMultiplier, takerFeeRate, subClientId, leverage) {
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
        let size = Math.floor(amount / (lastPrice * quantoMultiplier));
        let spotAmount = size * quantoMultiplier * firstAskPrice; 
        spotAmount = spotAmount + (spotAmount * takerFeeRate); 
        console.log('Spot amount:', spotAmount);
        console.log('Size:', size);
        size = size * -1;
        
        
        const futuresResponse = await createFuturesShortOrder('usdt', pair, size);
        const spotResponse = await createSpotBuyOrder(pair, spotAmount);
        console.log('Futures response:', futuresResponse);
        console.log('Spot response:', spotResponse);
        const tradeId = uuid.v4()
        
        let futuresValue = futuresResponse.size * parseFloat(futuresResponse.fillPrice) * quantoMultiplier;
        let amountIncurred = spotAmount - futuresValue;
        
        const futuresBot = {
            userId: subClientId,
            matchingPairId: pair,
            futuresSize: futuresResponse.size,
            spotSize: spotResponse.amount,
            unrealisedPnl: 0,
            realisedPnl: 0,
            status: futuresResponse.status,
            entryPrice: futuresResponse.fillPrice,
            timestamp: new Date(),
            leverage: leverage,
            tradeType: 'short',
            orderId: futuresResponse.id,
            currentPrice: futuresResponse.fillPrice,
            pNL: 0,
            cumulativePNL: 0,
            isClose: false,
            taker: futuresResponse.tkfr,
            spotValue: spotAmount,
            futuresValue: futuresValue,
            amountIncurred: amountIncurred,
            quantoMultiplier: quantoMultiplier
        };
        await Bots.upsert(futuresBot, { fields: ['tradeId', 'userId'] });
        console.log('Futures bot created:', futuresBot);
        const spotBot = {
            userId: subClientId,
            matchingPairId: pair,
            spotSize: spotResponse.amount,
            unrealisedPnl: 0,
            realisedPnl: 0,
            status: spotResponse.status,
            entryPrice: spotResponse.fillPrice,
            timestamp: new Date(),
            leverage: leverage,
            tradeType: 'buy',
            orderId: spotResponse.id,
            currentPrice: spotResponse.avgDealPrice,
            pNL: 0,
            cumulativePNL: 0,
            isClose: true,
            taker: spotResponse.gtTakerFee,
            spotValue: spotAmount,
            futuresValue: futuresValue,
            amountIncurred: amountIncurred,
            quantoMultiplier: quantoMultiplier
        };
        console.log('Spot bot created:', spotBot);

    await Bots.upsert(spotBot, { fields: ['tradeId', 'userId'] });

    } catch (error) {
        console.error('Error in trade:', error.response ? error.response.data : error);
    }
}

module.exports = trade;



// const tradeData = {
//   pair: 'LAI_USDT',
//   amount: '5',
//   lastPrice: 0.04775,
//   quantoMultiplier: '10',
//   takerFeeRate: '0.00075',
//   subClientId: 19,
//   leverage: '1',
// };

// trade(tradeData.pair, tradeData.amount, tradeData.lastPrice, tradeData.quantoMultiplier, tradeData.takerFeeRate, tradeData.subClientId, tradeData.leverage);