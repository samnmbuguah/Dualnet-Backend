const WebSocket = require('ws');
const crypto = require('crypto');
const Scans = require('../models/ScansModel.js');

// WebSocket class
class GateWebSocket {
    constructor(urls, apiKey, apiSecret, tickers) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.tickers = tickers;
        this.lastPrices = {};
        this.lastFuturesPrice = null;
        this.lastSpotPrice = null;
        this.webSockets = urls.map(url => {
            const ws = new WebSocket(url);
            ws.on('open', this.onOpen.bind(this, ws, url));
            ws.on('message', this.onMessage.bind(this));
            ws.on('close', () => this.onClose(ws, url)); 
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
        const channel = url.includes('fx-ws') ? "futures.tickers" : "spot.tickers";
        const authRequired = false;
        this.tickers.forEach(ticker => {
            this.subscribe(ws, channel, [ticker], authRequired);
        });
    }

    onMessage(data) {
        const message = JSON.parse(data.toString());
        console.log('Data received from server:', message);

        if (message.channel === 'futures.tickers' && message.event === 'update') {
            message.result.forEach(result => {
                if (result.contract && result.last) {
                    const ticker = result.contract;
                    const lastPrice = parseFloat(result.last);
                    this.lastPrices[ticker] = this.lastPrices[ticker] || {};
                    this.lastPrices[ticker].futures = lastPrice;
                }
            });
        } else if (message.channel === 'spot.tickers' && message.event === 'update') {
            if (message.result.currency_pair && message.result.last) {
                const ticker = message.result.currency_pair;
                const lastPrice = parseFloat(message.result.last);
                this.lastPrices[ticker] = this.lastPrices[ticker] || {};
                this.lastPrices[ticker].spot = lastPrice;
            }
        }

        Object.keys(this.lastPrices).forEach(ticker => {
            if (this.lastPrices[ticker].futures && this.lastPrices[ticker].spot) {
                const futuresPrice = this.lastPrices[ticker].futures;
                const spotPrice = this.lastPrices[ticker].spot;
                const valueDifference = futuresPrice - spotPrice;
                let percentageDifference = ((futuresPrice - spotPrice) / spotPrice) * 100;
                percentageDifference = parseFloat(percentageDifference.toFixed(4));

                Scans.upsert({
                    matchingPairId: ticker,
                    futuresPrice: futuresPrice,
                    spotPrice: spotPrice,
                    valueDifference: valueDifference,
                    percentageDifference: percentageDifference
                });

                console.log('Percentage difference between futures and spot for', ticker, ':', percentageDifference);
            }
        });
        console.log('Last prices:', this.lastPrices);
    }

    onClose(ws, url) {
        console.log('WebSocket disconnected:', url);
        // Attempt to reconnect after a delay
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            ws = new WebSocket(url);
        }, 5000); // 5 second delay
    }

    onError(err) {
        console.error('WebSocket error:', err);
    }
}

module.exports = GateWebSocket;
