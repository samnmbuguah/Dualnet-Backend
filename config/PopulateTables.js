const Contracts = require('../models/FuturesModel.js');
const Currencies = require('../models/SpotModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const {fetchSpotPairs, fetchFuturesContracts, findMatchingPairs} = require( '../services/GateioServices.js');
async function populateTables() {
    try {
        const spotPairs = await fetchSpotPairs();
        const futuresContracts = await fetchFuturesContracts();

        // Insert data into tables

        await Currencies.bulkCreate(spotPairs);
        await Contracts.bulkCreate(futuresContracts);

        // Find matching pairs
        const matchingPairs = await findMatchingPairs();
        await MatchingPairs.bulkCreate(matchingPairs);

        console.log('Tables have been populated');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

populateTables();