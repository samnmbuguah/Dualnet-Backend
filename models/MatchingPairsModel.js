const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const Contracts = require("./FuturesModel.js");
const Currencies = require("./SpotModel.js");
// Define the MatchingPairs model
const MatchingPairs = db.define('MatchingPairs', {
    id: {
    type: Sequelize.STRING,
    primaryKey: true
    },
    base: {
    type: Sequelize.STRING
    },
    quote: {
    type: Sequelize.STRING
    },
    fee: {
    type: Sequelize.STRING
    },
    minBaseAmount: {
    type: Sequelize.STRING
    },
    minQuoteAmount: {
    type: Sequelize.STRING
    },
    maxBaseAmount: {
    type: Sequelize.STRING
    },
    maxQuoteAmount: {
    type: Sequelize.STRING
    },
    amountPrecision: {
    type: Sequelize.INTEGER
    },
    precision: {
    type: Sequelize.INTEGER
    },
    tradeStatus: {
    type: Sequelize.STRING
    },
    sellStart: {
    type: Sequelize.BIGINT
    },
    buyStart: {
    type: Sequelize.BIGINT
    },
    name: {
    type: Sequelize.STRING,
    primaryKey: true
    },
    type: {
    type: Sequelize.STRING
    },
    quantoMultiplier: {
    type: Sequelize.STRING
    },
    leverageMin: {
    type: Sequelize.STRING
    },
    leverageMax: {
    type: Sequelize.STRING
    },
    maintenanceRate: {
    type: Sequelize.STRING
    },
    markType: {
    type: Sequelize.STRING
    },
    markPrice: {
    type: Sequelize.STRING
    },
    indexPrice: {
    type: Sequelize.STRING
    },
    lastPrice: {
    type: Sequelize.STRING
    },
    makerFeeRate: {
    type: Sequelize.STRING
    },
    takerFeeRate: {
    type: Sequelize.STRING
    },
    orderPriceRound: {
    type: Sequelize.STRING
    },
    markPriceRound: {
    type: Sequelize.STRING
    },
    fundingRate: {
    type: Sequelize.STRING
    },
    fundingInterval: {
    type: Sequelize.INTEGER
    },
    fundingNextApply: {
    type: Sequelize.BIGINT
    },
    riskLimitBase: {
    type: Sequelize.STRING
    },
    riskLimitStep: {
    type: Sequelize.STRING
    },
    riskLimitMax: {
    type: Sequelize.STRING
    },
    orderSizeMin: {
    type: Sequelize.INTEGER
    },
    orderSizeMax: {
    type: Sequelize.INTEGER
    },
    orderPriceDeviate: {
    type: Sequelize.STRING
    },
    refDiscountRate: {
    type: Sequelize.STRING
    },
    refRebateRate: {
    type: Sequelize.STRING
    },
    orderbookId: {
    type: Sequelize.BIGINT
    },
    tradeId: {
    type: Sequelize.BIGINT
    },
    tradeSize: {
    type: Sequelize.BIGINT
    },
    positionSize: {
    type: Sequelize.BIGINT
    },
    configChangeTime: {
    type: Sequelize.BIGINT
    },
    inDelisting: {
    type: Sequelize.BOOLEAN
    },
    ordersLimit: {
    type: Sequelize.INTEGER
    },
    enableBonus: {
    type: Sequelize.BOOLEAN
    },
    enableCredit: {
    type: Sequelize.BOOLEAN
    },
    createTime: {
    type: Sequelize.BIGINT
    },
    fundingCapRatio: {
    type: Sequelize.STRING
    }
}, {
    freezeTableName:true
});

// Define the relationships
Contracts.hasMany(MatchingPairs, { foreignKey: 'name' });
Currencies.hasMany(MatchingPairs, { foreignKey: 'id' });
MatchingPairs.belongsTo(Contracts, { foreignKey: 'name' });
MatchingPairs.belongsTo(Currencies, { foreignKey: 'id' });


module.exports = MatchingPairs;