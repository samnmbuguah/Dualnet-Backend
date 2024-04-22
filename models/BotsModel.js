const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");
const MatchingPairs = require("./MatchingPairsModel.js");
const Users = require("./UserModel.js");

const Bots = db.define('Bots', {
    botId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: Sequelize.INTEGER,
    },
    matchingPairId: {
        type: Sequelize.STRING,
    },
    futuresSize: {
        type: Sequelize.FLOAT
    },
    spotSize: {
        type: Sequelize.FLOAT
    },
    unrealisedPnl: {
        type: Sequelize.FLOAT
    },
    realisedPnl: {
        type: Sequelize.FLOAT
    },
    status: {
        type: Sequelize.STRING
    },
    spotEntryPrice: {
        type: Sequelize.FLOAT
    },
    futuresEntryPrice: {
        type: Sequelize.FLOAT
    },
    exitPrice: {
        type: Sequelize.FLOAT
    },
    timestamp: {
        type: Sequelize.DATE
    },
    leverage: {
        type: Sequelize.FLOAT
    },
    tradeType: {
        type: Sequelize.STRING
    },
    orderId: {
        type: Sequelize.STRING
    },
    currentPrice: {
        type: Sequelize.FLOAT
    },
    pNL: {
        type: Sequelize.FLOAT
    },
    cumulativePNL: {
        type: Sequelize.FLOAT
    }, 
    isLiq: {
        type: Sequelize.BOOLEAN
    },
    isClose: {
        type: Sequelize.BOOLEAN
    },
    settle:{
        type: Sequelize.STRING,
        defaultValue: 'usdt'
    },
    taker: {
        type: Sequelize.STRING
    },
    spotValue: {
        type: Sequelize.FLOAT
    },
    futuresValue: {
        type: Sequelize.FLOAT
    },
    amountIncurred: {
        type: Sequelize.FLOAT
    },
    quantoMultiplier: { 
        type: Sequelize.FLOAT
    },
    positionId: {
        type: Sequelize.STRING
    },
    profitThreshold: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0
    }, 
    fundingRate: {
        type: Sequelize.FLOAT
    },
    accumulatedFunding: {
        type: Sequelize.FLOAT,
        defaultValue: 0
    },

});

module.exports = Bots;