const GateApi = require('gate-api');
const client = require('./gateClient');

const api = new GateApi.FuturesApi(client);

function changeLeverage(settle, contract, leverage) {
    const opts = {};

    return api.updatePositionLeverage(settle, contract, leverage, opts)
        .then(response => {
            console.log('Leverage changed successfully', response.body);
            return response.body;
        })
        .catch(error => console.error(error.response.data));
}

module.exports = changeLeverage;

// Call the function
changeLeverage('usdt', 'MOVEZ_USDT', "1")