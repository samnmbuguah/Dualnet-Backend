const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const Bots = require("../models/BotsModel.js");
const fetchSpotBalance = require("./fetchSpotBalance");
const getApiCredentials = require("./getApiCredentials");

async function closeShort(
  pair,
  subClientId,
  futuresSize,
  positionId,
  multiplier
) {
  try {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
      throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);

    const futuresApi = new GateApi.FuturesApi(client);
    const amount = futuresSize / multiplier;
    
    const futuresOrder = new GateApi.FuturesOrder();
    futuresOrder.contract = pair;
    futuresOrder.settle = "usdt";
    futuresOrder.size = futuresSize;
    futuresOrder.price = "0";
    futuresOrder.tif = "ioc";
    futuresOrder.reduceOnly = true;

    return futuresApi
      .createFuturesOrder("usdt", futuresOrder)
      .then(async (response) => {
        console.log("Futures close order response", response.body);
        await Bots.update(
          {
            isClose: true,
            status: "No spot found, closed futures/liquidation",
          },
          {
            where: {
              positionId: positionId,
            },
          }
        );
        return true;
      })
      .catch((error) => {
        console.error(error.response);
        return false;
      });
  } catch (error) {
    console.error("Error during trading:", error);
    return false;
  }
}

async function sellSpotPosition(pair, subClientId, spotSize, positionId) {
  try {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
      throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);

    const spotApi = new GateApi.SpotApi(client);
    const order = new GateApi.Order();
    order.account = "spot";
    order.type = "market";
    order.currencyPair = pair;
    order.amount = spotSize;
    order.side = "sell";
    order.timeInForce = "ioc";

    return spotApi
      .createOrder(order)
      .then(async (response) => {
        console.log("Spot sell order response", response.body);
        await Bots.update(
          {
            isClose: true,
            status: "No futures position found, closing spot",
          },
          {
            where: {
              positionId: positionId,
            },
          }
        );
        return true;
      })
      .catch((error) => {
        console.error(error.response);
        return false;
      });
  } catch (error) {
    console.error("Error during trading:", error);
    return false;
  }
}

module.exports = { closeShort, sellSpotPosition };