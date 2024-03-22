require('dotenv').config();
const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const API_KEY= process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

client.setApiKeySecret(API_KEY, API_SECRET);

//Fetch all futures contracts
function fetchFuturesContracts() {
    console.log('Fetching futures contracts...');
    const futuresApi = new GateApi.FuturesApi(client);
    const settle = "usdt"
    
    return futuresApi.listFuturesContracts(settle)
    .then(value => value.body)
    .catch(error => console.error(error));
}

//Fetch all Spot pairs
function fetchSpotPairs() {
    console.log('Fetching spot pairs...');
    const spotApi = new GateApi.SpotApi(client);
    
    return spotApi.listCurrencyPairs()
    .then(value => value.body)
    .catch(error => console.error(error));
}

// Function to find spot pairs whose id matches with a futures contract 'name' field
function findMatchingPairs() {
    return Promise.all([fetchFuturesContracts(), fetchSpotPairs()])
    .then(([futuresContracts, spotPairs]) => {
        const futuresContractsMap = new Map();
        futuresContracts.forEach(contract => futuresContractsMap.set(contract.name, contract));

        return spotPairs
            .filter(spotPair => futuresContractsMap.has(spotPair.id))
            .map(spotPair => ({
                id: spotPair.id,
                fundingRate: futuresContractsMap.get(spotPair.id).fundingRate,
                name: futuresContractsMap.get(spotPair.id).name,
                precision: spotPair.precision,
                amountPrecision: spotPair.amountPrecision,
                fee: spotPair.fee,
            }));
    })
    .catch(error => console.error(error));
}

// // Call fetchSpotPairs
// fetchSpotPairs()
//     .then(spotPairs => console.log(spotPairs[0]))
//     .catch(error => console.error(error));

// // Call fetchFuturesContracts
// fetchFuturesContracts()
//     .then(futuresContracts => console.log(futuresContracts[0]))
//     .catch(error => console.error(error));

// // Call findMatchingPairs
// findMatchingPairs()
// .then(matchingPairs => console.log('Matching pairs: ', matchingPairs.length, matchingPairs[0]))
// .catch(error => console.error(error));

// const api = new GateApi.AccountApi(client);
// //Get account details
// api.getAccountDetail()
//    .then(value => console.log('API called successfully. Returned data: ', value.body),
//        error => console.error(error));
module.exports = findMatchingPairs;
