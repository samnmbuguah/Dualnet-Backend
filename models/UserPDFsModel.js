const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const { DataTypes } = Sequelize;

const UserPDFs = db.define('UserPDFs', {
    user_id: {
        type: DataTypes.INTEGER,
    },
    pdf_path: {
        type: DataTypes.STRING,
    },
    prev_X_coordinate: {
        type: DataTypes.FLOAT,
    },
    prev_Y_coordinate: {
        type: DataTypes.FLOAT,
    },
    pages: {
        type: DataTypes.INTEGER,
    },
    count: {
        type: DataTypes.INTEGER,
    },
}, {
    freezeTableName: true
});

module.exports = UserPDFs;
