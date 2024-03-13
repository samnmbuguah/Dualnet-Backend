const  {Sequelize} = require("sequelize");

const db = new Sequelize('dualnet_db', 'dualnetadmin', 'password', {
    host: "localhost",
    dialect: "mysql"
});