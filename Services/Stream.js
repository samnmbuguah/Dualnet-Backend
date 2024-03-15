const { WebsocketClient } = require('gateio-api');
require('dotenv').config();
const API_KEY= process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const wsConfig = {
    key: API_KEY,
    secret: API_SECRET,
};

const ws = new WebsocketClient(wsConfig);

ws.subscribe(['ticker.BTC_USDT']);

ws.on('update', data => {
    console.log('update', data);
});

ws.on('error', err => {
    console.error('ERR', err);
});