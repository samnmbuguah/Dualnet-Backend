const  {Sequelize} = require("sequelize");


const db = new Sequelize('dualnet_db', 'dualnetadmin', 'arbitrage', {
    host: "db",
    dialect: "mysql"
});

// const db = new Sequelize('dualnet_db', 'dualnetadmin', 'arbitrage', {
//     host: "localhost",
//     dialect: "mysql"
// });

module.exports = db;
