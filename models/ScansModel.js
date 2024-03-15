const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const Scans = db.define('Scans', {
    ticker: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    spotPrice: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    futuresPrice: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    valueDifference: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    percentageDifference: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    fundingRate: {
        type: Sequelize.FLOAT,
        allowNull: true
    }
});

module.exports = Scans;