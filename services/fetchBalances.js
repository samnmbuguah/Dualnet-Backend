const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const getApiCredentials = require('./getApiCredentials');

// Fetch spot account balances
function fetchSpotBalances() {
    console.log('Fetching spot account balances...');
    const spotApi = new GateApi.SpotApi(client);

    return spotApi.listSpotAccounts()
        .then(response => {
            console.log('Fetched spot account balances');
            const usdtBalance = response.body.find(account => account.currency === 'USDT');
            console.log('Spot USDT balance: ', usdtBalance.available);
            // console.log('response.body', response.body)
            return usdtBalance.available;
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
            // console.log('response.body', response.body)
            return response.body.available;
        })
        .catch(error => console.error(error));
}


// Fetch both spot and futures account balances
async function fetchBothBalances(subClientId) {
    try {
        const credentials = await getApiCredentials(subClientId);
        if (credentials) {
            client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);

            const spotBalances = await fetchSpotBalances();
            const futuresBalances = await fetchFuturesBalances();
            console.log('Balances', [spotBalances, futuresBalances]);
            return [spotBalances, futuresBalances];
        } else {
            console.error('API credentials not found');
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = fetchBothBalances;


// // Call the functions
// fetchBothBalances(3)