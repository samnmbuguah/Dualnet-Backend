const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");


// Define the MatchingPairs model
const MatchingPairs = db.define('MatchingPairs', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Add other fields as needed
}, {
    freezeTableName:true
});

module.exports = MatchingPairs;