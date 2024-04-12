const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const getApiCredentials = require('./getApiCredentials');

async function fetchPosition(settle, contract, subClientId) {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
        throw new Error('Could not fetch API credentials. Aborting trade.');
    }
    
    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);
    const api = new GateApi.FuturesApi(client);
    return api.getPosition(settle, contract)
        .then(response => {
            console.log('Futures position fetched. Size', response.body.size);
            return response.body;
        })
        .catch(error => console.error(error.response));
}

module.exports = fetchPosition;

// // Call the function
// fetchPosition('usdt', 'LAI_USDT',18)
//     .then(() => console.log('Futures position fetched successfully'))
