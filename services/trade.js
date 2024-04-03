const GateApi = require('gate-api');
const client = require('./gateClient');
const getContractDetails = require('./getContract');
const getFirstAsk = require('./getFirstAsk');
const spotApi = new GateApi.SpotApi(client);
const futuresApi = new GateApi.FuturesApi(client);

let spotOrderId;
let futuresOrderId;

function createSpotBuyOrder(pair, amount) {
    console.log('Creating spot buy order...');
    const order = new GateApi.Order();
    order.account = 'spot'; 
    order.currencyPair = pair;
    order.amount = amount;
    order.side = 'buy';
    order.type = 'market'; // Set type to 'market'
    order.timeInForce = 'fok'; // FillOrKill, fill either completely or none 

    return spotApi.createOrder(order)
        .then(response => {
            spotOrderId = response.body.id;
            console.log('Spot buy order created', response.body);
        })
        .catch(error => console.error(error.response.data));
}

function createFuturesShortOrder(settle, contract, size) {
    console.log('Creating futures short order...');
    const futuresOrder = new GateApi.FuturesOrder();
    futuresOrder.contract = contract;
    futuresOrder.size = size;
    futuresOrder.price = '0'; // Order price. 0 for market order with tif set as ioc
    futuresOrder.tif = 'ioc'; // Time in force
    futuresOrder.reduce_only = false; // Set as true to be reduce-only order
    futuresOrder.close = false; // Set as true to close the position, with size set to 0

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

async function trade(pair, amount, lastPrice, quantoMultiplier, takerFeeRate) {
    const firstAskPrice =  await getFirstAsk(pair);
    try {
        const contracts = Math.floor(amount / (lastPrice * quantoMultiplier));
        let spotAmount = contracts * quantoMultiplier * firstAskPrice; // Get the first ask price
        spotAmount = spotAmount + (spotAmount * takerFeeRate); // Add 0.1% taker fee
        console.log('Spot amount:', spotAmount);
        console.log('Contracts:', contracts);
        // return;
        await createFuturesShortOrder('usdt', pair, contracts);
        await createSpotBuyOrder(pair, spotAmount);
    } catch (error) {
        console.error('Error in trade:', error.response ? error.response.data : error);
    }
}

module.exports = trade;

// async function executeTrade() {
//     try {
//         const contractData = await getContractDetails('usdt', 'MOVEZ_USDT');
//         const firstAskPrice =  await getFirstAsk('MOVEZ_USDT');
//         console.log('Executing trade...');
//         await trade(
//             'MOVEZ_USDT',
//             '5',
//             contractData.lastPrice,
//             contractData.quantoMultiplier,
//             0.001,
//         );
//     } catch (error) {
//         console.error(error);
//     }
// }

// executeTrade();

// function checkPriceConvergence() {
//     // Replace this with actual logic to check price convergence
//     // This is just a placeholder
//     return Math.random() < 0.01;
// }
