const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const getApiCredentials = require("./getApiCredentials");

async function setLeverage(settle, contract, leverage = 1, subClientId) {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
        throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);
    const futuresApi = new GateApi.FuturesApi(client);
    const options = {
      crossLeverageLimit: leverage, // string | Cross margin leverage(when `leverage` is 0)
    };

    return futuresApi
        .updatePositionLeverage(settle, contract,0 , options)
        .then((response) => {
            console.log("Leverage set", response.body);
            return response.body;
        })
        .catch((error) => {
            console.error(error.response);
            throw error;
        });
}

module.exports = setLeverage;
