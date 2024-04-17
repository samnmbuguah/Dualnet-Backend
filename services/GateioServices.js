const GateApi = require('gate-api');
const client = require('./gateClient');

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

function findMatchingPairs() {
    return Promise.all([fetchFuturesContracts(), fetchSpotPairs()])
    .then(([futuresContracts, spotPairs]) => {
        const futuresContractsMap = new Map();
        futuresContracts.forEach(contract => futuresContractsMap.set(contract.name, contract));

        return spotPairs
            .filter(spotPair => futuresContractsMap.has(spotPair.id))
            .map(spotPair => {
                const contract = futuresContractsMap.get(spotPair.id);
                const fundingRate = parseFloat((contract.fundingRate * 100).toFixed(6));
                if (fundingRate > 1) {
                    return null;
                }
                return {
                    id: spotPair.id,
                    fundingRate: fundingRate,
                    name: contract.name,
                    precision: spotPair.precision,
                    amountPrecision: spotPair.amountPrecision,
                    fee: spotPair.fee,
                    quantoMultiplier: contract.quantoMultiplier,
                    leverageMin: contract.leverageMin,
                    leverageMax: contract.leverageMax,
                    maintenanceRate: contract.maintenanceRate,
                    makerFeeRate: contract.makerFeeRate,
                    takerFeeRate: contract.takerFeeRate,
                    fundingNextApply: contract.fundingNextApply,
                    base: spotPair.base,
                    minBaseAmount: spotPair.minBaseAmount,
                    minQuoteAmount: spotPair.minQuoteAmount
                };
            })
            .filter(pair => pair !== null);
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

// Call findMatchingPairs
// findMatchingPairs()
//     .then(matchingPairs => console.log('Matching pairs: ', matchingPairs.length, matchingPairs[0]))
//     .catch(error => console.error(error));

module.exports = findMatchingPairs;
