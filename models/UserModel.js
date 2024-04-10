const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const { DataTypes } = Sequelize;

const Users = db.define('users', {
    id: { 
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    username:{
        type: DataTypes.STRING
    },
    password:{
        type: DataTypes.STRING
    },
    email:{
        type: DataTypes.STRING
    },
    account_no:{
        type: DataTypes.STRING
    },
    api_key: {
        type: DataTypes.STRING(5000)
    },
    api_secret: {
        type: DataTypes.STRING
    },
    wallet:{
        type: DataTypes.INTEGER
    },
    investment:{
        type: DataTypes.INTEGER
    },
    begin_date:{
        type: DataTypes.DATEONLY
    },
    Net_client_share_in_percent:{
        type: DataTypes.INTEGER
    },
    usertype:{
        type: DataTypes.INTEGER
    },
    Admin_id:{
        type: DataTypes.STRING
    },
    fee:{
        type: DataTypes.DECIMAL(10, 2),
    },
    profit_now: {
        type: DataTypes.DECIMAL(10, 2), 
    },
    user_roles: {
        type:DataTypes.STRING
    }
},{
    freezeTableName:true
});

module.exports = Users;










