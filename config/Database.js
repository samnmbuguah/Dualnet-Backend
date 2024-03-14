const  {Sequelize} = require("sequelize");

const db = new Sequelize('dualnet_db', 'dualnetadmin', 'arbitrage', {
    host: "localhost",
    dialect: "mysql"
});

module.exports = db;



// const db = new Sequelize('dualnet_db','root','password',{  //'dualnet_db','fasqazjz_manager','kkk123!@#W',{ 
//     host: "localhost",
//     dialect: "mysql"
// });

// module.exports = db;
