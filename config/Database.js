const { Sequelize } = require('sequelize');

const db = new Sequelize('railway', 'postgres', 'VFwQxOHkqOHYTsGCGjifjqJGOGlCWPZU', {
    host: 'viaduct.proxy.rlwy.net',
    dialect: 'postgres',
    port: 16646,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = db;
