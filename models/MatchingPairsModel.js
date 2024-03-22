const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

// Define the MatchingPairs model
const MatchingPairs = db.define('MatchingPairs', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    fundingRate: {
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    precision: {
        type: Sequelize.INTEGER
    },
    amountPrecision: {
        type: Sequelize.INTEGER
    },
    spotfee: {
        type: Sequelize.STRING
    }
}, {
    freezeTableName:true
});

module.exports = MatchingPairs;