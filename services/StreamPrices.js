let GateWebSocket;
module.exports = function(io) {
    GateWebSocket = require('./GateWebSocket.js')(io);
}
const MatchingPairs = require('../models/MatchingPairsModel.js');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const wsFuturesUrl = 'wss://fx-ws.gateio.ws/v4/ws/usdt'
const wsSpotUrl = 'wss://api.gateio.ws/ws/v4/'


if (!API_KEY || !API_SECRET) {
    console.error('API_KEY and API_SECRET are required');
    process.exit(1);
}

// Create a new GateWebSocket instance
let tickers = [];
let ws;

let retryCount = 0;
const maxRetries = 5;
const retryDelay = 5000; // 5 seconds

function fetchMatchingPairs() {
    try {
        MatchingPairs.findAll({
            limit: 10
        }).then(records => {
            if (!records) {
                console.error('No records found');
                return;
            }
            tickers = records.map(record => record.id);
            if (!tickers || tickers.length === 0) {
                tickers = ['BTC_USDT',"ETH_USDT"];
            }
            ws = new GateWebSocket([wsFuturesUrl, wsSpotUrl], API_KEY, API_SECRET, tickers);
        });
    } catch (error) {
        console.error('An error occurred:', error);
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(fetchMatchingPairs, retryDelay);
        } else {
            console.error('Max retries exceeded. Exiting...');
            process.exit(1);
        }
    }
}

fetchMatchingPairs();

process.on('SIGINT', function () {
    console.log("Caught interrupt signal, closing websockets");

    // Check if ws and ws.webSockets are defined before trying to close the WebSocket connections
    if (ws && ws.webSockets) {
        for (let websocket of ws.webSockets) {
            websocket.close();
        }
    } else {
        console.error('ws or ws.webSockets is undefined');
    }

    // Exit the process
    process.exit();
});