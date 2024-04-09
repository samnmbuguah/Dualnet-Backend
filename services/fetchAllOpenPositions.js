const GateApi = require('gate-api');
const client = require('./gateClient');

const api = new GateApi.FuturesApi(client);

function fetchAllOpenPositions(settle) {
    return api.listPositions(settle)
        .then(response => {
            console.log('All open futures positions fetched.');
            console.log("response.body", response.body);
            return response.body;
        })
        .catch(error => console.error(error.response.data));
}

module.exports = fetchAllOpenPositions;

// Call the function
fetchAllOpenPositions('usdt')
    .then(() => console.log('All open futures positions fetched successfully'))