require('dotenv').config();
const express = require('express');
const app = express();
const path = require("path");
const cors = require('cors');
const cron = require('node-cron');
const server = require('http').createServer(app); // Create server with Express app

// Check for required environment variables
if (!process.env.PORT) {
  console.error("Missing PORT environment variable. Please check your .env file");
  process.exit(1);
}

// CORS configuration
console.log("IN",process.env.ENVIRONMENT, "ENVIRONMENT");
let corsOptions = {
  origin: ['https://dualnet-production.up.railway.app', 'http://localhost:3042', 'http://localhost:3000', 'http://dualnet.railway.internal'],
};

if (process.env.ENVIRONMENT === 'development') {
  corsOptions = { origin: '*' }; // Allow all origins in development
}

app.use(cors(corsOptions));

const populateTables = require('./jobs/PopulateTables.js');
const StreamPrices = require('./services/StreamPrices.js');
const router = require("./routes/Routes.js");
const PORT = process.env.PORT || 3042; 

app.use(express.json());
app.use('/api', router);

if (process.env.ENVIRONMENT !== 'development') {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../FrontendDualnet/build')))

  // All other GET requests not handled before will return our React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../FrontendDualnet/build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
  StreamPrices(server); // Start streaming prices after the server has started
});

cron.schedule('0 * * * *', populateTables);