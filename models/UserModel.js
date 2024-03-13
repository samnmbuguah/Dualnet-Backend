const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const { DataTypes } = Sequelize;

const Users = db.define('users',{
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
    api_token:{
        type: DataTypes.STRING
    },
    reward:{
        type: DataTypes.STRING
    },
    reward_stopout:{
        type: DataTypes.STRING
    }, 
    hedge:{
        type: DataTypes.INTEGER
    },
    hedge_stopout:{
        type: DataTypes.INTEGER
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
    refresh_token:{
        type: DataTypes.STRING
    },
    fee:{
        type: DataTypes.DECIMAL(10, 2),
    },
    usdt_account_number:{
        type: DataTypes.STRING
    },
    Total_assets_today: {
        type: DataTypes.DECIMAL(10, 2), 
      },
    profit_now: {
        type: DataTypes.DECIMAL(10, 2), 
    },
    Share_of_main_account_in_percent: {
        type: DataTypes.DECIMAL(5, 2), // Example: 5 digits in total with 2 decimal places
    },
    user_roles: {
        type:DataTypes.STRING
    },
    flash_main_assets: {
        type: DataTypes.INTEGER,
    },
    flash_client_profit: {
        type: DataTypes.INTEGER,
    },
    temp_assets: {
        type: DataTypes.INTEGER

    },
},{
    freezeTableName:true
});

module.exports = Users;










