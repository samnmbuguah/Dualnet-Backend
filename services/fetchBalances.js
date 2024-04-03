const GateApi = require('gate-api');
const client = require('./gateClient');

// Fetch spot account balances
function fetchSpotBalances() {
    console.log('Fetching spot account balances...');
    const spotApi = new GateApi.SpotApi(client);

    return spotApi.listSpotAccounts()
        .then(response => {
            console.log('Fetched spot account balances');
            const usdtBalance = response.body.find(account => account.currency === 'USDT');
            console.log('Spot USDT balance: ', usdtBalance.available);
            return response.body;
        })
        .catch(error => console.error(error));
}

// Fetch futures account balances
function fetchFuturesBalances() {
    console.log('Fetching futures account balances...');
    const futuresApi = new GateApi.FuturesApi(client);

    return futuresApi.listFuturesAccounts('usdt') // replace 'usdt' with your settle currency
        .then(response => {
            console.log('Fetched futures account balances');
            console.log('Futures account balances: ', response.body.available);
            return response.body;
        })
        .catch(error => console.error(error));
}

module.exports = {
    fetchSpotBalances,
    fetchFuturesBalances,
};



// // Call the functions
// fetchSpotBalances();
// fetchFuturesBalances();