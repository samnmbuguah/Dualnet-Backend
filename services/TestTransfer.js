const GateApi = require('gate-api');
const Transfer = GateApi.Transfer;
const client = require('./gateClient');

const api = new GateApi.WalletApi(client);
const transfer = new Transfer();

// Set the properties
transfer.from = 'spot'; // Replace with your actual 'from' account type
transfer.to = 'futures'; // Replace with your actual 'to' account type
transfer.currency = 'USDT'; // Replace with your actual currency
transfer.amount = '10'; // Replace with your actual amount
transfer.settle = 'USDT'; // Replace with your actual settle currency

api.transfer(transfer)
   .then(value => console.log('API called successfully. Returned data: ', value.body),
     error => {
       console.error('Error message: ', error.response.data.message);
       console.error('Error code: ', error.response.status);
     });