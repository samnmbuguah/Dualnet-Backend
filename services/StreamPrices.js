const GateWebSocket = require('./GateWebSocket.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const wsFuturesUrl = 'wss://fx-ws.gateio.ws/v4/ws/usdt'
const wsSpotUrl = 'wss://api.gateio.ws/ws/v4/'

let tickers = [];
let ws;

MatchingPairs.findAll({
    limit: 5
}).then(records => {
    tickers = records.map(record => record.id);
    ws = new GateWebSocket([wsFuturesUrl, wsSpotUrl], API_KEY, API_SECRET, tickers);
});

process.on('SIGINT', function () {
    console.log("Caught interrupt signal, closing websockets");

    // Close all WebSocket connections
    for (let websocket of ws.webSockets) {
        websocket.close();
    }
    // Exit the process
    process.exit();
});