require('dotenv').config();
const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const API_KEY= process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

client.setApiKeySecret(API_KEY, API_SECRET);
const api = new GateApi.AccountApi(client);

// //Get account details
// api.getAccountDetail()
//    .then(value => console.log('API called successfully. Returned data: ', value.body),
//        error => console.error(error));


//Fetch all futures contracts
function fetchFuturesContracts() {
    const futuresApi = new GateApi.FuturesApi(client);
    const settle = "usdt"
    
    return futuresApi.listFuturesContracts(settle)
    .then(value => value.body)
    .catch(error => console.error(error));
}

//Fetch all Spot pairs
function fetchSpotPairs() {
    const spotApi = new GateApi.SpotApi(client);
    
    return spotApi.listCurrencyPairs()
    .then(value => value.body)
    .catch(error => console.error(error));
}

// Function to find spot pairs whose id matches with a futures contract 'name' field
function findMatchingPairs() {
    return Promise.all([fetchFuturesContracts(), fetchSpotPairs()])
    .then(([futuresContracts, spotPairs]) => {
        const matchingPairs = spotPairs
            .filter(spotPair => futuresContracts.some(futuresContract => futuresContract.name === spotPair.id))
            .map(spotPair => {
                const futuresContract = futuresContracts.find(contract => contract.name === spotPair.id);
                return { ...spotPair, ...futuresContract };
            });

        const unmatchedFutures = futuresContracts.filter(futuresContract => 
            !spotPairs.some(spotPair => spotPair.id === futuresContract.name)
        );

        console.log('Unmatched futures: ', unmatchedFutures.map(contract => contract.name));

        return matchingPairs;
    })
    .catch(error => console.error(error));
}

// Call the function
findMatchingPairs()
.then(matchingPairs => console.log('Matching pairs: ', matchingPairs.length, matchingPairs[0]))
.catch(error => console.error(error));

module.exports = {
    fetchSpotPairs,
    fetchFuturesContracts,
    findMatchingPairs
};