const GateApi = require("gate-api");
const client = new GateApi.ApiClient();
const { closeShort, sellSpotPosition } = require("./checkCloseTrades");
const fetchSpotBalance = require("./fetchSpotBalance");
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
      console.error(error.response);
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
  fundingRate,
  closeByProfit,
  closeByDeviation
) {
  let firstAskPrice;
  let positionId = uuid.v4();
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
    if (!spotResponse) {
      throw new Error("Spot buy order creation failed.");
    }

    const futuresResponse = await createFuturesShortOrder("usdt", pair, size);
    if (!futuresResponse) {
      console.log(
        "Futures short order creation failed. Selling spot position..."
      );
      let spotBalance = await fetchSpotBalance(pair, subClientId);
      spotBalance = parseFloat(spotBalance.available);
      let intendedSpotSize = -size * quantoMultiplier;
      let spotBalancePercentageDifference = Math.abs(
        (spotBalance - intendedSpotSize) / intendedSpotSize
      );

      if (spotBalancePercentageDifference <= 0.02) {
        await sellSpotPosition(
          pair,
          subClientId,
          spotBalance.toString(),
          positionId
        );
      } else if (spotBalance > intendedSpotSize) {
        await sellSpotPosition(
          pair,
          subClientId,
          intendedSpotSize.toString(),
          positionId
        );
      }

      throw new Error("Futures short order creation failed sold spot");
    }

    let fillPrice = parseFloat(futuresResponse.fillPrice);
    let multiplier = parseFloat(quantoMultiplier);
    let futuresSize = -parseFloat(futuresResponse.size) * multiplier;
    let futuresValue = futuresSize * fillPrice;
    let takerFee = futuresValue * parseFloat(futuresResponse.tkfr);
    futuresValue = futuresValue + takerFee;
    let amountIncurred = spotAmount + futuresValue;
    let openingDifference =
      parseFloat(futuresResponse.fillPrice) -
      parseFloat(spotResponse.avgDealPrice);
    let openingPercentageDifference =
      (openingDifference / parseFloat(spotResponse.avgDealPrice)) * 100;

    const futuresBot = {
      userId: subClientId,
      matchingPairId: pair,
      futuresSize: futuresSize,
      spotSize: futuresSize,
      status: "Futures Position Opened",
      spotEntryPrice: spotResponse.avgDealPrice,
      futuresEntryPrice: futuresResponse.fillPrice,
      timestamp: new Date(),
      leverage: leverage,
      tradeType: "short",
      orderId: futuresResponse.id,
      currentPrice: futuresResponse.fillPrice,
      isClose: false,
      takerFee: takerFee,
      spotValue: spotAmount,
      futuresValue: futuresValue,
      amountIncurred: amountIncurred,
      quantoMultiplier: multiplier,
      positionId: positionId,
      fundingRate: fundingRate,
      accumulatedFunding: 0,
      openingDifference: openingPercentageDifference,
      profitThreshold: closeByProfit,
      closeByDeviation: closeByDeviation,
    };
    await Bots.create(futuresBot);
    console.log("Futures bot created:", futuresBot);
    const spotBot = {
      userId: subClientId,
      matchingPairId: pair,
      spotSize: futuresSize,
      status: "Spot Position Opened",
      spotEntryPrice: spotResponse.avgDealPrice,
      futuresEntryPrice: futuresResponse.fillPrice,
      timestamp: new Date(),
      leverage: leverage,
      tradeType: "buy",
      orderId: spotResponse.id,
      currentPrice: spotResponse.avgDealPrice,
      isClose: true,
      takerFee: spotResponse.gtTakerFee,
      spotValue: spotAmount,
      futuresValue: futuresValue,
      amountIncurred: amountIncurred,
      quantoMultiplier: multiplier,
      positionId: positionId,
      fundingRate: fundingRate,
      accumulatedFunding: 0,
      openingDifference: openingPercentageDifference,
      profitThreshold: closeByProfit,
      closeByDeviation: closeByDeviation,
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
