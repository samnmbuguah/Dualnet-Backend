const socketIO = require('socket.io');
const PollPrices = require('./GateioPolling.js');
const Scans = require('../models/ScansModel.js'); 
const MatchingPairs = require('../models/MatchingPairsModel.js');
const { Op } = require('sequelize');

const maxRetries = 5;
const retryDelay = 5000; 

async function fetchTopScans() {
    return await Scans.findAll({
        where: {
            fundingRate: {
                [Op.gt]: 0.1 // greater than 0.1
            },
            percentageDifference: {
                [Op.gt]: 0 // greater than 0
            }
        },
        order: [['percentageDifference', 'DESC']], // sorts by percentageDifference
        limit: 10
    });
}

async function fetchAndLogPrices(pollPrices, io) {
    // Debug: Log the result of fetchAndUpdateScans
    const updateResult = await pollPrices.fetchAndUpdateScans();
    console.log('fetchAndUpdateScans result:', updateResult);

    // If fetchAndUpdateScans was successful, fetch top scans from the database
    if (updateResult === 'Scans updated successfully') {
        const topScans = await fetchTopScans();

        // Debug: Log the top scans
        // console.log('Top scans:', topScans);

        // Emit top scans to the client
        io.emit('topScans', topScans);
    }
}

async function StreamPrices(server, retryCount = 0) {
    try {
        const records = await MatchingPairs.findAll({
            attributes: ['id', 'amountPrecision', 'fundingRate'],
            where: {
                fundingRate: {
                    [Op.gt]: 0.1
                }
            },
            limit: 30
        });
        let tickers, amountPrecisions;
        if (!records || records.length === 0) {
            console.error('No matching pairs found . Using default tickers...');
            tickers = ['BTC_USDT', "ETH_USDT"];
            amountPrecisions = [2, 2]; // default values
        } else {
            tickers = records.map(record => record.id);
            amountPrecisions = records.map(record => record.amountPrecision);
        }

        const io = socketIO(server, {
            cors: {
                origin: process.env.ENVIRONMENT === 'development' ? '*' : ['https://dualnet-production.up.railway.app', 'http://localhost:3042', 'http://localhost:3000', 'http://dualnet.railway.internal'],
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on('error', (error) => {
            console.error('Server error:', error);
        });

        // Pass parameters to PollPrices constructor
        const pollPrices = new PollPrices(tickers, "usdt", amountPrecisions); 
        fetchAndLogPrices(pollPrices, io);
        setInterval(() => fetchAndLogPrices(pollPrices, io), 300000);

        // Listen for the 'updateScans' event from the client and handle it
        io.on('connection', (socket) => {
            const address = server.address();
            console.log(`Websocket server connected to ${address.address}:${address.port}`);
            socket.on('updateScans', async () => {
                // Fetch top scans from the database
                const topScans = await fetchTopScans();

                // Emit top scans to the client
                socket.emit('topScans', topScans);
                fetchAndLogPrices(pollPrices, io);
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            socket.on('disconnect', (reason) => {
                console.log(`Client disconnected: ${reason}`);
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => StreamPrices(server, retryCount + 1), retryDelay); 
        } else {
            console.error('Max retries exceeded. Exiting...');
            process.exit(1);
        }
    }
}
module.exports = StreamPrices;