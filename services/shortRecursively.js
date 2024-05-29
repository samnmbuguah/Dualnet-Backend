const getApiCredentials = require("./getApiCredentials");
const setLeverage = require("./setLeverage");
const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const fetchPosition = require("./getPosition");
const ccxt = require("ccxt");

async function shortRecursively(
    pair,
    entryPrice,
    stopLoss,
    amount,
    lastPrice,
    quantoMultiplier,
    takerFeeRate,
    subClientId,
    leverage
) {
  try {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
      throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);
  } catch (error) {
    console.error(error.message);
    return;
  }

  try {
    let size = Math.floor(amount / (lastPrice * parseFloat(quantoMultiplier)));
    size = size * -1;

    await setLeverage("usdt", pair, leverage, subClientId);

    const futuresResponse = await createFuturesShortOrder(
      "usdt",
      pair,
      size,
      entryPrice
    );

    if (futuresResponse) {
      // Create a stop loss order with the same size
      await createStopLossOrder("usdt", pair, stopLoss, size);

      let position = await fetchPosition("usdt", pair, subClientId);
      let positionSize = position ? position.size : 0;

      while (positionSize < 0) {
        await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 1 minute
        position = await fetchPosition("usdt", pair, subClientId);
        positionSize = position ? position.size : 0;
      }

      // Create a trigger limit order
      // await createTriggerLimitOrder("usdt", pair, entryPrice, subClientId);
    } else {
      throw new Error("Futures short order creation failed.");
    }

    console.log("Futures short order created:", futuresResponse);
    return true;
  } catch (error) {
    console.error(
      "Error in trade:",
      error.response ? error.response.data : error
    );
    return false;
  }
}

function createFuturesShortOrder(settle, contract, size, entryPrice) {
    const futuresApi = new GateApi.FuturesApi(client);
    console.log("Creating futures short order...");
    const futuresOrder = new GateApi.FuturesOrder();
    futuresOrder.contract = contract;
    futuresOrder.size = size;
    futuresOrder.price = entryPrice.toString(); // Limit order at entry price
    futuresOrder.tif = "gtc"; // Good till cancelled

    return futuresApi
        .createFuturesOrder(settle, futuresOrder)
        .then((response) => {
            console.log("Futures short order created", response.body);
            return response.body;
        })
        .catch((error) => {
            console.error(error.response);
        });
}

async function createTriggerLimitOrder(settle, contract, triggerPrice) {
    const futuresApi = new GateApi.FuturesApi(client);

    const futuresPriceTriggeredOrder = new GateApi.FuturesPriceTriggeredOrder();
    futuresPriceTriggeredOrder.contract = contract;
    futuresPriceTriggeredOrder.triggerPrice = triggerPrice.toString(); // Trigger price
    futuresPriceTriggeredOrder.orderPrice = triggerPrice.toString(); // Order price
    futuresPriceTriggeredOrder.size = "1"; // Order size
    futuresPriceTriggeredOrder.side = "sell"; // Order side
    futuresPriceTriggeredOrder.orderType = "limit"; // Order type
    futuresPriceTriggeredOrder.tif = "gtc"; // Good till cancelled

    return futuresApi
        .createPriceTriggeredOrder(settle, futuresPriceTriggeredOrder)
        .then((response) => {
            console.log("Trigger limit order created", response.body);
            return response.body;
        })
        .catch((error) => {
            console.error(error.response);
            throw error;
        });
}


async function createStopLossOrder(settle, contract, stopLossPrice, size) {
    const futuresApi = new GateApi.FuturesApi(client);

    const futuresPriceTriggeredOrder = new GateApi.FuturesPriceTriggeredOrder();
    futuresPriceTriggeredOrder.contract = contract;
    futuresPriceTriggeredOrder.triggerPrice = stopLossPrice.toString(); // Trigger price
    futuresPriceTriggeredOrder.orderPrice = "0"; // Market order
    futuresPriceTriggeredOrder.size = (size * -1).toString(); // Order size, opposite of the short order
    futuresPriceTriggeredOrder.side = "buy"; // Order side
    futuresPriceTriggeredOrder.orderType = "market"; // Order type
    futuresPriceTriggeredOrder.reduceOnly = true; // Reduce-only order

    return futuresApi
        .createPriceTriggeredOrder(settle, futuresPriceTriggeredOrder)
        .then((response) => {
            console.log("Stop loss order created", response.body);
            return response.body;
        })
        .catch((error) => {
            console.error(error.response);
            throw error;
        });
}



const pair = 'BTC_USDT';
const entryPrice = 67600;
const stopLoss = 69100;
const amount = 7;
const lastPrice = 67700;
const quantoMultiplier = '0.0001';
const takerFeeRate = '0.00075';
const subClientId = 18;
const leverage = 1;

shortRecursively(pair, entryPrice, stopLoss, amount, lastPrice, quantoMultiplier, takerFeeRate, subClientId, leverage)
    .then((result) => {
        console.log('Short order created:', result);
    })
    .catch((error) => {
        console.error('Error creating short order:', error);
    });