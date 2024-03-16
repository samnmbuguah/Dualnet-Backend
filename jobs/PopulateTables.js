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
        if (currencies && currencies.length > 0) {
            await Currencies.bulkCreate(currencies, { updateOnDuplicate: currencyFields });
        } else {
            console.error('No currencies data to populate');
        }
        if (matchingPairs) { // Add opening parenthesis here
            const matchingPairs = await findMatchingPairs();
            await MatchingPairs.bulkCreate(matchingPairs, { updateOnDuplicate: matchingPairFields });
        }

        // Fetch fundingRate from MatchingPairs and update Scans
        for (let pair of matchingPairs) {
            const matchingPair = await MatchingPairs.findOne({ where: { id: pair.id } });
            if (matchingPair) {
                const fundingRate = matchingPair.fundingRate;
                const scan = await Scans.findOne({ where: { matchingPairId: pair.id } }); // assuming matchingPairId is the foreign key in Scans table
                if (scan) {
                    await scan.update({ fundingRate: fundingRate });
                    console.log("Updated funding rate for matching pair",scan )
                }
            }
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