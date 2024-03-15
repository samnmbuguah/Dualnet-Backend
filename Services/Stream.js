const WebSocket = require('ws');
const crypto = require('crypto');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const wsSpot = new WebSocket('wss://api.gateio.ws/ws/v4/');
const wsFutures = new WebSocket('wss://fx-ws.gateio.ws/v4/ws/usdt');

// Spot WebSocket connection
wsSpot.on('open', function open() {
    const nonce = Math.floor(Date.now() / 1000); // use second timestamp
    const method = 'server.time';
    const sign = crypto.createHmac('sha512', API_SECRET).update(`${method}${nonce}`).digest('hex');

    const authMsg = {
        "id": 12311,
        "method": method,
        "params": [],
        "auth": {
            "method": "api_key",
            "KEY": API_KEY,
            "SIGN": sign
        }
    };
    wsSpot.send(JSON.stringify(authMsg));


    const subscribeMsgSpot = {
        "id": 12312,
        "method": "ticker.subscribe",
        "params": ["BTC_USDT"]
    };
    wsSpot.send(JSON.stringify(subscribeMsgSpot));
});

wsSpot.on('message', function incoming(data) {
    const dataStr = data.toString();
    const dataJson = JSON.parse(dataStr);
    console.log('Spot data:', dataJson);
});

wsSpot.on('error', function error(err) {
    console.error('Spot ERR', err);
});

// Futures WebSocket connection
wsFutures.on('open', function open() {
    const nonce = Math.floor(Date.now() / 1000); // use second timestamp
    const method = 'server.time';
    const sign = crypto.createHmac('sha512', API_SECRET).update(`${method}${nonce}`).digest('hex');

    const authMsg = {
        "id": 12313,
        "method": method,
        "params": [],
        "auth": {
            "method": "api_key",
            "KEY": API_KEY,
            "SIGN": sign
        }
    };
    wsFutures.send(JSON.stringify(authMsg));

    const subscribeMsgFutures = {
        "id": 12314,
        "method": "futures.tickers",
        "params": ["BTC_USDT"]
    };
    wsFutures.send(JSON.stringify(subscribeMsgFutures));
});

wsFutures.on('message', function incoming(data) {
    const dataStr = data.toString();
    const dataJson = JSON.parse(dataStr);
    console.log('Futures data:', dataJson);
});

wsFutures.on('error', function error(err) {
    console.error('Futures ERR', err);
});