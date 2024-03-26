
require('dotenv').config();
const GateApi = require('gate-api');
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const client = new GateApi.ApiClient();
client.setApiKeySecret(apiKey, apiSecret);
const spotApi = new GateApi.SpotApi(client);
const futuresApi = new GateApi.FuturesApi(client);
const onScansUpdated = require('./ScansServer.js');
const Scans = require('../models/ScansModel.js');
const { Op } = require("sequelize");

class PollPrices {
    constructor(tickers, settle, io, amountPrecisions,server) {
        this.amountPrecisions = amountPrecisions;
        this.tickers = tickers;
        this.settle = settle;
        this.server = server;
        this.lastPrices = {};
        this.io = io;
        this.init();
    }

    async init() {
        const values = await this.getSpotAndFuturesPrice();
        this.updateScans(values);
    }

    async getSpotAndFuturesPrice() {
        try {
            const promises = this.tickers.map(ticker => {
                const spotPromise = spotApi.listCandlesticks(ticker, { interval: '1m', limit: 1 })
                    .then(value => {
                        const closeValue = value.body[0][4];
                        return closeValue;
                    }, error => console.error(error));

                const futuresPromise = futuresApi.listFuturesCandlesticks(this.settle, ticker, { interval: '1m', limit: 1 })
                    .then(value => {
                        const closeValue = value.body[0].c;
                        return closeValue;
                    }, error => console.error(error));

                return Promise.all([futuresPromise, spotPromise]);
            });

            return Promise.all(promises);
        } catch (error) {
            console.error(error);
        }
    } 

    async updateScans(values) {
        const upsertPromises = values.map((value, index) => {
            const ticker = this.tickers[index];
            const futuresPrice = value[0];
            const spotPrice = value[1];
            let valueDifference = futuresPrice - spotPrice;
            valueDifference = parseFloat(valueDifference.toFixed(this.amountPrecisions[index]));
            let percentageDifference = ((futuresPrice - spotPrice) / spotPrice) * 100;
            percentageDifference = parseFloat(percentageDifference.toFixed(4));

            return Scans.upsert({
                matchingPairId: ticker,
                futuresPrice: futuresPrice,
                spotPrice: spotPrice,
                valueDifference: valueDifference,
                percentageDifference: percentageDifference
            });
        });

        Promise.all(upsertPromises).then(async () => {
            const topScans = await Scans.findAll({
                where: {
                    percentageDifference: {
                        [Op.gt]: 0 // filters out records with negative percentageDifference
                    }
                },
                order: [['percentageDifference', 'DESC']], // sorts by percentageDifference from highest to lowest
                limit: 5 // gets the first 5 records
            });
            console.log('Top scans updated in the database');
            this.io.emit('All Prices Updated', topScans);
            onScansUpdated(this.server, topScans); // Pass server to onScansUpdated
        });

        values.forEach((value, index) => {
            const ticker = this.tickers[index];
            const futuresPrice = value[0];
            const spotPrice = value[1];
            let percentageDifference = ((futuresPrice - spotPrice) / spotPrice) * 100;
            percentageDifference = parseFloat(percentageDifference.toFixed(4));
            // console.log('Percentage difference between futures and spot for', ticker, ':', percentageDifference);
        });
    }
}

module.exports = PollPrices;
