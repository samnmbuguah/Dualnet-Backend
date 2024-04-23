const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const getCurrentSpotPrice = require("./getCurrentSpotPrice");
const getApiCredentials = require("./getApiCredentials");
const Bots = require("../models/BotsModel.js");
const uuid = require("uuid");

function createSpotBuyOrder(pair, amount) {
  const spotApi = new GateApi.SpotApi(client);
  console.log("Creating spot buy order...");
  const order = new GateApi.Order();
  order.account = "spot";
  order.currencyPair = pair;
  order.amount = amount;
  order.side = "buy";
  order.type = "market";
  order.timeInForce = "fok";

  return spotApi
    .createOrder(order)
    .then((response) => {
      console.log("Spot buy order created", response.body);
      return response.body;
    })
    .catch((error) => {
      console.error(error.response.data);
      throw error;
    });
}

function createFuturesShortOrder(settle, contract, size) {
  const futuresApi = new GateApi.FuturesApi(client);
  console.log("Creating futures short order...");
  const futuresOrder = new GateApi.FuturesOrder();
  futuresOrder.contract = contract;
  futuresOrder.size = size;
  futuresOrder.price = "0"; // Market order
  futuresOrder.tif = "ioc";
  futuresOrder.reduce_only = false;
  futuresOrder.close = false;

  return futuresApi
    .createFuturesOrder(settle, futuresOrder)
    .then((response) => {
      console.log("Futures short order created", response.body);
      return response.body;
    })
    .catch((error) => {
      console.error(error.response);
      throw error;
    });
}

async function trade(
  pair,
  amount,
  lastPrice,
  quantoMultiplier,
  takerFeeRate,
  subClientId,
  leverage,
  fundingRate
) {
  let firstAskPrice;
  try {
    const credentials = await getApiCredentials(subClientId);
    if (!credentials) {
      throw new Error("Could not fetch API credentials. Aborting trade.");
    }

    client.setApiKeySecret(credentials.apiKey, credentials.apiSecret);
    prices = await getCurrentSpotPrice(pair);
    firstAskPrice = parseFloat(prices.lowestAsk);
  } catch (error) {
    console.error(error.message);
    return;
  }

  try {
    let size = Math.floor(amount / (lastPrice * parseFloat(quantoMultiplier)));
    let spotAmount = size * quantoMultiplier * firstAskPrice;
    spotAmount = spotAmount + spotAmount * takerFeeRate;
    console.log("Spot amount:", spotAmount);
    console.log("Size:", size);
    size = size * -1;

    const spotResponse = await createSpotBuyOrder(pair, spotAmount);
    const futuresResponse = await createFuturesShortOrder("usdt", pair, size);

    let fillPrice = parseFloat(futuresResponse.fillPrice);
    let multiplier = parseFloat(quantoMultiplier);
    let futuresSize = -parseFloat(futuresResponse.size) * multiplier;
    let futuresValue = futuresSize * fillPrice;
    let takerFee = futuresValue * parseFloat(futuresResponse.tkfr);
    futuresValue = futuresValue + takerFee;
    let amountIncurred = spotAmount + futuresValue;
    let positionId = uuid.v4();

    const futuresBot = {
      userId: subClientId,
      matchingPairId: pair,
      futuresSize: futuresSize,
      spotSize: futuresSize,
      unrealisedPnl: 0,
      realisedPnl: 0,
      status: "Futures Position Opened",
      spotEntryPrice: spotResponse.avgDealPrice,
      futuresEntryPrice: futuresResponse.fillPrice,
      timestamp: new Date(),
      leverage: leverage,
      tradeType: "short",
      orderId: futuresResponse.id,
      currentPrice: futuresResponse.fillPrice,
      pNL: 0,
      cumulativePNL: 0,
      isClose: false,
      taker: takerFee,
      spotValue: spotAmount,
      futuresValue: futuresValue,
      amountIncurred: amountIncurred,
      quantoMultiplier: multiplier,
      positionId: positionId,
      fundingRate: fundingRate,
      accumulatedFunding: 0,
    };
    await Bots.create(futuresBot);
    console.log("Futures bot created:", futuresBot);
    const spotBot = {
      userId: subClientId,
      matchingPairId: pair,
      spotSize: futuresSize,
      unrealisedPnl: 0,
      realisedPnl: 0,
      status: "Spot Position Opened",
      spotEntryPrice: spotResponse.avgDealPrice,
      futuresEntryPrice: futuresResponse.fillPrice,
      timestamp: new Date(),
      leverage: leverage,
      tradeType: "buy",
      orderId: spotResponse.id,
      currentPrice: spotResponse.avgDealPrice,
      pNL: 0,
      cumulativePNL: 0,
      isClose: true,
      taker: spotResponse.gtTakerFee,
      spotValue: spotAmount,
      futuresValue: futuresValue,
      amountIncurred: amountIncurred,
      quantoMultiplier: multiplier,
      positionId: positionId,
      fundingRate: fundingRate,
      accumulatedFunding: 0,
    };
    console.log("Spot bot created:", spotBot);

    await Bots.create(spotBot);
    return true;
  } catch (error) {
    console.error(
      "Error in trade:",
      error.response ? error.response.data : error
    );
    return false;
  }
}

module.exports = trade;

// const tradeData = {
//   pair: "POGAI_USDT",
//   amount: "4",
//   closeByProfit: "1",
//   lastPrice: "0.000591",
//   leverage: "1",
//   quantoMultiplier: "10000",
//   subClientId: "3",
//   takerFeeRate: "0.00075",
// };

// trade(tradeData.pair, tradeData.amount, tradeData.lastPrice, tradeData.quantoMultiplier, tradeData.takerFeeRate, tradeData.subClientId, tradeData.leverage);
