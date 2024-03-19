const  {Sequelize} = require("sequelize");

const db = new Sequelize('dualnet_db', 'dualnetadmin', 'arbitrage', {
    host: "localhost",
    dialect: "mysql",
    pool: {
    max: 5,
    min: 0,
    acquire: 3000000, 
    idle: 10000
    }
});

module.exports = db;

// mysql -u dualnetadmin -p dualnet_db
// UPDATE users SET usertype = 1;
