const cron = require('node-cron');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const Scans = require('../models/ScansModel.js');
const findMatchingPairs = require( '../services/GateioServices.js');
async function populateTables() {
    console.log('Populating tables...');

    try {
        // Fetch matching pairs from Gate.io API
        const matchingPairs = await findMatchingPairs();

        // Insert data into tables
        if (matchingPairs) {
            await MatchingPairs.bulkCreate(matchingPairs, { updateOnDuplicate: ['fundingRate', 'precision', 'amountPrecision', 'fee'] });
            console.log("Inserted",matchingPairs.length,"matching pairs into the MatchingPairs table");
        } else {
            console.log("No matching pairs found");
        }

        // Fetch fundingRate from MatchingPairs and update Scans
        const scansCount = await Scans.count();
        if (scansCount === 0) {
            // If the Scans table is empty, create a new Scan for each MatchingPair
            const newScans = matchingPairs.map(pair => ({
                matchingPairId: pair.id,
                fundingRate: pair.fundingRate
            }));
            await Scans.bulkCreate(newScans);
            console.log("Created new scans for all", matchingPairs.length,"matching pairs");
        } else {
            const newScans = matchingPairs.map(pair => ({
                matchingPairId: pair.id,
                fundingRate: pair.fundingRate,
            }));

            await Scans.bulkCreate(newScans, {
                updateOnDuplicate: ["fundingRate"]
            });
            console.log("Updated funding rate for all", matchingPairs.length,"scans");
        }

        console.log('Tables have been populated');
    } catch (error) {
        console.error(error);
    }
}

module.exports = populateTables;

// Run the task immediately
// populateTables();

// // Schedule the task to run at the beginning of every hour
// cron.schedule('0 * * * *', populateTables);