const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const getApiCredentials = require("./getApiCredentials");

async function setLeverage(req, res) {
  try {
    const { settle, contract, leverage = "1", subClientId } = req.body;

    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
      throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);

    const futuresApi = new GateApi.FuturesApi(client);

    const opts = {
      crossLeverageLimit: leverage, // string | Cross margin leverage(valid only when `leverage` is 0)
    };

    const response = await futuresApi.updatePositionLeverage(settle, contract, 0, opts);
    console.log("Leverage changed successfully", response.body);
    res.json(response.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = setLeverage;
