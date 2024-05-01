const db = require('./Database.js'); 

db.authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(error => console.error('Unable to connect to the database:', error));

    // PGPASSWORD=VFwQxOHkqOHYTsGCGjifjqJGOGlCWPZU pg_dump -h viaduct.proxy.rlwy.net -U postgres -p 16646 -d railway > backup.sql
