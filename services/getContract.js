const GateApi = require('gate-api');
const client = require('./gateClient');

const futuresApi = new GateApi.FuturesApi(client);

function getContractDetails(settle, contract) {
    return futuresApi.listFuturesContracts(settle)
        .then(response => {
            const contractDetails = response.body.find(item => item.name === contract);
            if (contractDetails) {
                console.log('Contract data fetched:', contractDetails.name);
                return contractDetails; // Return the contract details
            } else {
                console.log(`Contract ${contract} not found.`);
                return null; // Return null if the contract is not found
            }
        })
        .catch(error => {
            console.error(error.response);
            return null; // Return null if there's an error
        });
}

module.exports = getContractDetails;

// // Usage:
// getContractDetails('usdt', 'BTC_USDT');