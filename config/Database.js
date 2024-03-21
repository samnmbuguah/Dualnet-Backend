const { Sequelize } = require('sequelize');

const db = new Sequelize('railway', 'postgres', 'VFwQxOHkqOHYTsGCGjifjqJGOGlCWPZU', {
    host: 'viaduct.proxy.rlwy.net',
    dialect: 'postgres',
    port: 16646,
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
});

module.exports = db;