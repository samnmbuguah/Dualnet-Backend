const WebSocket = require('ws');
const crypto = require('crypto');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const wsFuturesUrl = 'wss://fx-ws.gateio.ws/v4/ws/usdt'
const wsSpotUrl = 'wss://api.gateio.ws/ws/v4/'
const ticker = 'BTC_USDT';

// WebSocket class

class GateWebSocket {
    constructor(urls, apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.webSockets = urls.map(url => {
            const ws = new WebSocket(url);
            ws.on('open', this.onOpen.bind(this, ws, url));
            ws.on('message', this.onMessage.bind(this));
            ws.on('error', this.onError.bind(this));
            return ws;
        });
    }

    getSign(message) {
        return crypto.createHmac('sha512', this.apiSecret).update(message).digest('hex');
    }

    request(ws, channel, event, payload, authRequired = true) {
        const currentTime = Math.floor(Date.now() / 1000);
        const data = {
            time: currentTime,
            channel: channel,
            event: event,
            payload: payload,
        };
        if (authRequired) {
            const message = `channel=${channel}&event=${event}&time=${currentTime}`;
            data.auth = {
                method: "api_key",
                KEY: this.apiKey,
                SIGN: this.getSign(message),
            };
        }
        ws.send(JSON.stringify(data));
    }

    subscribe(ws, channel, payload, authRequired = true) {
        this.request(ws, channel, "subscribe", payload, authRequired);
    }

    unsubscribe(channel, payload, authRequired = true) {
        this.request(channel, "unsubscribe", payload, authRequired);
    }

    onOpen(ws, url) {
        console.log('WebSocket connected:', url);
        const channel = url.includes('fx-ws') ? "futures.tickers" : "spot.trades";
        const authRequired = false;
        this.subscribe(ws, channel, [ticker], authRequired);
    }

    onMessage(data) {
        const message = JSON.parse(data.toString());
        console.log('Data received from server:', message);
    }

    onError(err) {
        console.error('WebSocket error:', err);
    }
}

const ws = new GateWebSocket([wsFuturesUrl, wsSpotUrl], API_KEY, API_SECRET);