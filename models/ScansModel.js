const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const Scans = db.define('Scans', {
    matchingPairId: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    spotPrice: {
        type: Sequelize.FLOAT
    },
    futuresPrice: {
        type: Sequelize.FLOAT
    },
    valueDifference: {
        type: Sequelize.FLOAT
    },
    percentageDifference: {
        type: Sequelize.FLOAT
    },
    fundingRate: {
        type: Sequelize.FLOAT,
        validate: {
        max: {
            args: 1,
            msg: 'fundingRate must be less than or equal to 1'
        }
    }
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
    makerFeeRate: {
        type: Sequelize.STRING
    },
    takerFeeRate: {
        type: Sequelize.STRING
    },
    fundingNextApply: {
        type: Sequelize.INTEGER
    },
    base: {
        type: Sequelize.STRING
    },
    minBaseAmount: {
        type: Sequelize.STRING
    },
    minQuoteAmount: {
        type: Sequelize.STRING
    }
});

module.exports = Scans;