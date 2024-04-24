const socketIO = require("socket.io");
const PollPrices = require("./GateioPolling.js");
const Scans = require("../models/ScansModel.js");
const MatchingPairs = require("../models/MatchingPairsModel.js");
const { Op } = require("sequelize");
const moment = require("moment");

let tickers, amountPrecisions, fundingRates;
const maxRetries = 5;
const retryDelay = 300000;

async function fetchTopScans() {
  console.log("Fetching top scans...");
  const topScans = await Scans.findAll({
    where: {
      percentageDifference: {
        [Op.gt]: 0, // greater than 0
      },
      fundingRate: {
        [Op.gte]: 0.01,
      },
      updatedAt: {
        [Op.gte]: moment().subtract(10, "minutes").toDate(), // updated within the last minutes
      },
    },
    order: [["percentageDifference", "DESC"]], // sorts by percentageDifference
    limit: 10,
  });
  console.log("Top scans fetched successfully");
  return topScans;
}

async function fetchAndLogPrices(pollPrices, io) {
  updateResult = await pollPrices.fetchAndUpdateScans();

  // If fetchAndUpdateScans was successful, fetch top scans from the database
  if (updateResult) {
    // Emit top scans to the client
    const topScans = await fetchTopScans();
    io.emit("topScans", topScans);

    // Recursively call fetchAndLogPrices every 60 seconds
    setTimeout(() => fetchAndLogPrices(pollPrices, io), 60000);
  }
}

async function updateTickersAndPrecisions(pollPrices) {
  const records = await MatchingPairs.findAll({
    attributes: ["id", "precision", "fundingRate"],
    where: { fundingRate: { [Op.gte]: 0.01 } },
    order: [["fundingRate", "DESC"]],
    limit: 500,
  });

  if (!records || records.length === 0) {
    console.error("No matching pairs found . Using default tickers...");
    tickers = ["BTC_USDT", "ETH_USDT"];
    amountPrecisions = [8, 2]; // default values
  } else {
    tickers = records.map((record) => record.id);
    amountPrecisions = records.map((record) => record.precision);
    fundingRates = records.map((record) => record.fundingRate);
  }

  pollPrices.updateTickers(tickers, amountPrecisions);
}

async function StreamPrices(io, retryCount = 0) {
  try {
    // Pass parameters to PollPrices constructor
    const pollPrices = new PollPrices(tickers, "usdt", amountPrecisions);

    await updateTickersAndPrecisions(pollPrices);

    io.on("error", (error) => {
      console.error("Server error:", error);
    });

    fetchAndLogPrices(pollPrices, io);
    // setInterval(() => fetchAndLogPrices(pollPrices, io), 300000);

    // Update tickers and precisions every 5 minutes
    setInterval(() => updateTickersAndPrecisions(pollPrices), 400000);

    // Listen for the 'updateScans' event from the client and handle it
    io.on("connection", (socket) => {
      socket.on("updateScans", async () => {
        // Fetch top scans from the database
        const topScans = await fetchTopScans();

        // Emit top scans to the client
        socket.emit("topScans", topScans);
        fetchAndLogPrices(pollPrices, io);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${reason}`);
      });
    });
  } catch (error) {
    console.error("An error occurred:", error);
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      setTimeout(() => StreamPrices(io, retryCount + 1), retryDelay);
    } else {
      console.error("Max retries exceeded. Exiting...");
      process.exit(1);
    }
  }
}
module.exports = StreamPrices;
