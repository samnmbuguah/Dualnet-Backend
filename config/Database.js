const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

let db;
try {
    if (process.env.ENVIRONMENT === 'production') {
        db = new Sequelize(process.env.PROD_DB_NAME, process.env.PROD_DB_USER, process.env.PROD_DB_PASSWORD, {
            host: process.env.PROD_DB_HOST,
            dialect: 'postgres',
            logging: false,
            port: process.env.PROD_DB_PORT,
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
        db = new Sequelize(process.env.DEV_DB_NAME, process.env.DEV_DB_USER, process.env.DEV_DB_PASSWORD, {
            host: process.env.DEV_DB_HOST,
            dialect: 'postgres',
            logging: false,
            port: process.env.DEV_DB_PORT
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
