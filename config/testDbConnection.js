const db = require('./Database.js'); 


db.authenticate()
    .then(() => console.log('Database connection has been established successfully.'))
    .catch(error => console.error('Unable to connect to the database:', error));