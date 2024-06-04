const GateApi = require('gate-api');
const client = require('./gateClient');

const api = new GateApi.FuturesApi(client);

function fetchAllOpenPositions(settle) {
    return api.listPositions(settle)
        .then(response => {
            const nonZeroPositions = response.body.filter(position => position.size !== 0);
            console.log('All open futures positions with non-zero size fetched.');
            console.log("nonZeroPositions", nonZeroPositions);
            return nonZeroPositions;
        })
        .catch(error => console.error(error.response.data));
}

module.exports = fetchAllOpenPositions;

// Call the function
fetchAllOpenPositions('usdt')
    .then(() => console.log('All open futures positions with non-zero size fetched successfully'))