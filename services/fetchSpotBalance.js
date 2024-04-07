const GateApi = require('gate-api');
const client = require('./gateClient');

// Fetch spot account balance for a specific pair
function fetchSpotBalance(pair) {
    console.log(`Fetching spot account balance for ${pair}...`);
    const spotApi = new GateApi.SpotApi(client);

    return spotApi.listSpotAccounts()
        .then(response => {
            const baseCurrency = pair.split('_')[0]; // Extract base currency from pair
            const baseCurrencyBalance = response.body.find(account => account.currency === baseCurrency);
            console.log(`Spot ${baseCurrency} balance: `, baseCurrencyBalance.available);
            console.log('Spot account balance fetched successfully', baseCurrencyBalance, baseCurrency );
            return baseCurrencyBalance;
        })
        .catch(error => console.error(error));
}

module.exports = fetchSpotBalance;

// // Call the function
// fetchSpotBalance('MOVEZ_USDT');