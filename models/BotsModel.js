const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");
const MatchingPairs = require("./MatchingPairsModel.js");
const Users = require("./UserModel.js");

const Bots = db.define('Bots', {
        id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true
    },
    userId: {
        type: Sequelize.INTEGER
    },
    matchingPairId: {
        type: Sequelize.STRING,
        references: {
            model: MatchingPairs,
            key: 'id'
        }
    },
    size: {
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
    entryPrice: {
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
    tradeId: {
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
    }
});

// Define the relationship
Bots.belongsTo(MatchingPairs, { foreignKey: 'matchingPairId' });
MatchingPairs.hasMany(Bots, { foreignKey: 'id' });


// Define the relationship with Users
Bots.belongsTo(Users, { foreignKey: 'userId' });
Users.hasMany(Bots, { foreignKey: 'id' });

module.exports = Bots;