const GateApi = require('gate-api');
const client = require('./gateClient');
const getContractDetails = require('./getContract');

const spotApi = new GateApi.SpotApi(client);
const futuresApi = new GateApi.FuturesApi(client);

let spotOrderId;
let futuresOrderId;

function createSpotBuyOrder(pair, amount) {
    console.log('Creating spot buy order...');
    const order = new GateApi.Order();
    order.currencyPair = pair;
    order.amount = amount;
    order.side = 'buy';
    order.type = 'market'; // Set type to 'market'
    order.timeInForce = 'ioc'; // Set timeInForce to 'ioc'

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

async function trade(pair, amount) {
    try {
        const contract = await getContractDetails('usdt', pair);
        console.log('Contract:', contract, contract.quantoMultiplier);
        const lastPrice = parseFloat(contract.lastPrice);
        const quantoMultiplier = parseFloat(contract.quantoMultiplier);
        const makerFeeRate = parseFloat(contract.makerFeeRate);
        const takerFeeRate = parseFloat(contract.takerFeeRate);
        const fundingRate = parseFloat(contract.fundingRate);
        const maintenanceRate = parseFloat(contract.maintenanceRate);

        // Calculate the total fee rate
        const totalFeeRate = makerFeeRate + takerFeeRate + fundingRate + maintenanceRate;

        // Adjust the size to account for the fees
        const size = Math.round((amount / (lastPrice * quantoMultiplier)) * (1 + totalFeeRate));
        console.log('Size:', size);
        console.log('totalFeeRate:', totalFeeRate);
        // return;
        await createFuturesShortOrder('usdt', pair, size);
        await createSpotBuyOrder(pair, amount);
    } catch (error) {
        console.error('Error in trade:', error.response ? error.response.data : error);
    }
}


function closeOrders() {
    return Promise.all([
        spotApi.cancelOrder(spotOrderId),
        futuresApi.cancelOrder(futuresOrderId)
    ])
    .then(() => console.log('Orders closed'))
    .catch(error => console.error(error));
}

function checkPriceConvergence() {
    // Replace this with actual logic to check price convergence
    // This is just a placeholder
    return Math.random() < 0.01;
}


trade('MOVEZ_USDT', '5').catch(console.error);



// async function trade(pair, size) {
//     // await createSpotBuyOrder(pair, size);
//     await createFuturesShortOrder(pair, size); // Leverage is set to '1'

//     while (true) {
//         if (checkPriceConvergence()) {
//             await closeOrders();
//             break;
//         }

//         await new Promise(resolve => setTimeout(resolve, 1000));
//     }
// }