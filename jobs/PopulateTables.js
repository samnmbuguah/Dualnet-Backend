const cron = require('node-cron');
const Contracts = require('../models/FuturesModel.js');
const Currencies = require('../models/SpotModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const Scans = require('../models/ScansModel.js');
const {fetchSpotPairs, fetchFuturesContracts, findMatchingPairs} = require( '../services/GateioServices.js');

async function populateTables() {
    console.log('Populating tables...');

    try {
        function getAllModelFields(model) {
            return Object.keys(model.rawAttributes);
        }

        const spotPairs = await fetchSpotPairs();
        const futuresContracts = await fetchFuturesContracts();

        // Get all field names for each model
        const currencyFields = getAllModelFields(Currencies);
        const contractFields = getAllModelFields(Contracts);
        const matchingPairFields = getAllModelFields(MatchingPairs);

        // Insert data into tables
        await Currencies.bulkCreate(spotPairs, { updateOnDuplicate: currencyFields });
        await Contracts.bulkCreate(futuresContracts, { updateOnDuplicate: contractFields });

        // Find matching pairs
        const matchingPairs = await findMatchingPairs();
        await MatchingPairs.bulkCreate(matchingPairs, { updateOnDuplicate: matchingPairFields });

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