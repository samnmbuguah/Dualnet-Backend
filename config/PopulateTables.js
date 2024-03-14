const Contracts = require('../models/FuturesModel.js');
const Currencies = require('../models/SpotModel.js');
const {fetchSpotPairs, fetchFuturesContracts, findMatchingPairs} = require( '../Services/GateioServices.js');
async function populateTables() {
    try {
        const spotPairs = await fetchSpotPairs();
        const futuresContracts = await fetchFuturesContracts();

        // Assuming spotPairs and futuresContracts are arrays of objects
        // where each object's keys match the fields of your models

        await Currencies.bulkCreate(spotPairs);
        await Contracts.bulkCreate(futuresContracts);

        console.log('Tables have been populated');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

populateTables();