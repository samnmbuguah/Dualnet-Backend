require('dotenv').config();
const express = require('express');
const app = express();
const path = require("path");
const cors = require('cors');
const cron = require('node-cron');
const socketIO = require('socket.io');
const server = require('http').createServer(app); // Create server with Express app
const checkTrades = require('./services/checkTrades.js');
const closeByProfit = require('./services/closeByProfit.js');
const updateFundingRate = require('./services/getFundingRate.js');
const updateAccumulatedFunding = require('./services/updateAccumulatedFunding.js');
const Bots = require('./models/BotsModel.js');

// Check for required environment variables
if (!process.env.PORT) {
  console.error("Missing PORT environment variable. Please check your .env file");
  process.exit(1);
}

// CORS configuration
console.log("IN",process.env.ENVIRONMENT, "ENVIRONMENT");
let corsOptions = {
  origin: [
    "https://dualnet-production.up.railway.app",
    "http://localhost:3042",
    "http://localhost:3000",
    "http://dualnet.railway.internal",
    "http://172.16.5.4:3000",
  ],
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

// Create the WebSocket server
const io = socketIO(server, { cors: corsOptions });

io.on('connection', (socket) => {
    // When a client connects, they should emit a 'join' event with their userId
    socket.on('join', (userId) => {
        // The client joins a room with a name equal to their userId
        socket.join(userId);
    });

    // Listen for 'getBotData' event from the client
    socket.on('getBotData', async (userId) => {
        // Fetch all bots where isClose is false and userId matches the provided userId
        const bots = await Bots.findAll({ where: { isClose: false, userId: userId } });
        if (bots.length) {
            try {
                await closeByProfit(io, bots);
                console.log('Completed the Close By profit loop');
            } catch (error) {
                console.error('Error closing trades:', error);
            }
        }
    });
});

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
  StreamPrices(io); // Start streaming prices after the server has started
});

// Schedule the cron job
cron.schedule('* * * * *', async () => {
    // Fetch all bots where isClose is false
    const bots = await Bots.findAll({ where: { isClose: false } });
    if (bots.length) {
        try {
            await closeByProfit(io, bots);
            console.log('Completed the Close By profit loop');
        } catch (error) {
            console.error('Error closing trades:', error);
        }
    }
});

cron.schedule('0 0 * * *', populateTables);
cron.schedule('0 */8 * * *', updateAccumulatedFunding);
cron.schedule('*/10 * * * *', updateFundingRate);
checkTrades();