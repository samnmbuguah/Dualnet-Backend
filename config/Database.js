const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

let db;
try {
    if (process.env.ENVIRONMENT === 'production') {
        db = new Sequelize('railway', 'postgres', 'VFwQxOHkqOHYTsGCGjifjqJGOGlCWPZU', {
            host: 'viaduct.proxy.rlwy.net',
            dialect: 'postgres',
            logging: false,
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
    } else if (process.env.ENVIRONMENT === 'development') {
        db = new Sequelize('dualnetdb', 'dualnetadmin', 'password', {
            host: 'localhost',
            dialect: 'postgres',
            logging: false,
            port: 5432
        });
    } else {
        throw new Error("Environment not set. Please set the ENVIRONMENT environment variable to either 'production' or 'development'.");
    }

    console.log("Connected to database" + db.config.database + " on " + db.config.host + ":" + db.config.port);
} catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
}

module.exports = db;