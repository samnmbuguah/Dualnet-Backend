require('dotenv').config();
const express = require('express');
const path = require("path");
const app = express();
const cors = require('cors');
const server = require('http').createServer(app); // Create server with Express app
const cron = require('node-cron');
// app.use(cors());
app.use(cors({
    origin: ['https://dualnet-production.up.railway.app', 'http://localhost:3042', 'http://localhost:3000', 'http://dualnet.railway.internal'],
  }));
const populateTables = require('./jobs/PopulateTables.js');
const StreamPrices = require('./services/StreamPrices.js');
const router = require("./routes/Routes.js");
const PORT = process.env.PORT || 3042; 
const generatePdfCronJob = require('./jobs/generatePDF.js');

app.use(express.json());
app.use('/api', router);
app.use('/pdfs', express.static(path.join(__dirname, '..', 'pdfs')));
generatePdfCronJob();

StreamPrices(server)

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../FrontendDualnet/build')))

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../FrontendDualnet/build', 'index.html'));
});

cron.schedule('0 * * * *', populateTables);
server.listen(PORT, ()=> console.log(`Server running at port ${PORT}`)); // Start server 
