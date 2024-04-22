const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const Bots = require("../models/BotsModel.js");
const fetchSpotBalance = require("./fetchSpotBalance");
const getApiCredentials = require("./getApiCredentials");



async function sellSpotAndLongFutures(
  pair,
  subClientId,
  futuresSize = 0,
  spotSize,
  positionId,
  multiplier
) {
  try {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
      throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);

    const spotApi = new GateApi.SpotApi(client);
    const futuresApi = new GateApi.FuturesApi(client);
    const order = new GateApi.Order();
    order.account = "spot";
    order.type = "market";
    order.currencyPair = pair;
    order.amount = spotSize;
    order.side = "sell";
    order.timeInForce = "ioc";

    const baseCurrency = pair.split("_")[0];
    const spotBalance = await fetchSpotBalance(baseCurrency, subClientId);
    const availableSpotBalance = Number(spotBalance.available);

    if (availableSpotBalance <= spotSize) {
      order.amount = availableSpotBalance;
    }

    return spotApi
      .createOrder(order)
      .then(async (response) => {
        console.log("Spot sell order response", response.body);

        const amount = futuresSize / multiplier;
        const futuresOrder = new GateApi.FuturesOrder();
        futuresOrder.contract = pair;
        futuresOrder.settle = "usdt";
        futuresOrder.size = amount;
        futuresOrder.price = "0";
        futuresOrder.tif = "ioc";

        futuresApi
          .createFuturesOrder("usdt", futuresOrder)
          .then((response) =>
            console.log("Futures close order response", response.body)
          )
          .catch((error) => console.error(error.response));

        await Bots.update(
          { isClose: true },
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

module.exports = sellSpotAndLongFutures;

// const tradeData = {"pair":"POGAI_USDT","subClientId":3,"futuresSize":40000,"spotSize":39986.13154930825,"positionId":"9d86b592-1bad-43e5-93e9-a8b033cc9038","multiplier":10000}

// sellSpotAndLongFutures(
//   tradeData.pair,
//   tradeData.subClientId,
//   tradeData.futuresSize,
//   tradeData.spotSize,
//   tradeData.positionId
//   tradeData.multiplier
// );
