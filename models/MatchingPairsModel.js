const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const MatchingPairs = db.define('MatchingPairs', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true
    },
    fundingRate: {
        type: Sequelize.FLOAT
    },
    name: {
        type: Sequelize.STRING,
        unique: true
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