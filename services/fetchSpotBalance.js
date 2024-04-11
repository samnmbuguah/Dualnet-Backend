const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const getApiCredentials = require('./getApiCredentials');

// Fetch spot account balance for a specific pair
async function fetchSpotBalance(pair, userId) { // Add the async keyword here
    console.log(`Fetching spot account balance for ${pair}...`);

    try {
        const credentials = await getApiCredentials(userId);
        if (!credentials) {
            throw new Error('Could not fetch API credentials. Aborting trade.');
        }
    
        client.setApiKeySecret(credentials.apiKey, credentials.apiSecret); 

        const spotApi = new GateApi.SpotApi(client);

        return spotApi.listSpotAccounts()
            .then(response => {
                const baseCurrency = pair.split('_')[0]; // Extract base currency from pair
                const baseCurrencyBalance = response.body.find(account => account.currency === baseCurrency);
                return baseCurrencyBalance;
            })
            .catch(error => console.error(error));
    } catch (error) {
        console.error(error);
    }
}

module.exports = fetchSpotBalance;

// // Call the function
// fetchSpotBalance('MOVEZ_USDT');