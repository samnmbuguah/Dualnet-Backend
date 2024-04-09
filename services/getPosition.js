const GateApi = require('gate-api');
const client = require('./gateClient');

const api = new GateApi.FuturesApi(client);

function fetchPosition(settle, contract) {
    return api.getPosition(settle, contract)
        .then(response => {
            console.log('Futures position fetched. Size', response.body.size);
            return response.body;
        })
        .catch(error => console.error(error.response.data));
}

module.exports = fetchPosition;

// Call the function
fetchPosition('usdt', 'MOVEZ_USDT')
    .then(() => console.log('Futures position fetched successfully'))
