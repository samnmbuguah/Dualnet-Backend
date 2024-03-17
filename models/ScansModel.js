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
        type: Sequelize.FLOAT
    }
});

module.exports = Scans;