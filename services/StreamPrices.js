const MatchingPairs = require('../models/MatchingPairsModel.js');
const PollPrices = require('./GateioPolling.js');
const socketIO = require('socket.io');

const maxRetries = 5;
const retryDelay = 5000; // 5 seconds

async function fetchAndLogPrices(pollPrices) {
    const values = await pollPrices.getSpotAndFuturesPrice();
    pollPrices.updateScans(values);
}

async function StreamPrices(server, retryCount = 0) {
    try {
        const records = await MatchingPairs.findAll({
            attributes: ['id', 'amountPrecision'],
            limit: 20
        });

        let tickers, amountPrecisions;
        if (!records || records.length === 0) {
            console.error('No matching pairs found in the database. Using default tickers...');
            tickers = ['BTC_USDT', "ETH_USDT"];
            amountPrecisions = [2, 2]; // default values
        } else {
            tickers = records.map(record => record.id);
            amountPrecisions = records.map(record => record.amountPrecision);
        }

        const io = socketIO(server); //socketIO initialization
        // Pass parameters to PollPrices constructor
        const pollPrices = new PollPrices(tickers, "usdt", io, amountPrecisions, server); 
        fetchAndLogPrices(pollPrices);
        setInterval(() => fetchAndLogPrices(pollPrices), 60000);
    } catch (error) {
        console.error('An error occurred:', error);
        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => StreamPrices(server, retryCount + 1), retryDelay); 
        } else {
            console.error('Max retries exceeded. Exiting...');
            process.exit(1);
        }
    }
}
module.exports = StreamPrices;