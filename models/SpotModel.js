const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const Currencies = db.define('Currencies', {
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
  }
}, {
   freezeTableName:true
});

module.exports = Currencies;