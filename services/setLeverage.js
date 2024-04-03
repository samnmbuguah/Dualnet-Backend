const GateApi = require('gate-api');
const client = require('./gateClient');

const api = new GateApi.FuturesApi(client);

function setLeverage(settle, contract, leverage = "1") {
    const opts = {
        'crossLeverageLimit': "1" // string | Cross margin leverage(valid only when `leverage` is 0)
    };

    return api.updatePositionLeverage(settle, contract, leverage, opts)
        .then(response => {
            console.log('Leverage changed successfully', response.body);
            return response.body;
        })
        .catch(error => console.error(error.response.data));
}

module.exports = setLeverage;

// Call the function
setLeverage('usdt', 'MOVEZ_USDT', "0")