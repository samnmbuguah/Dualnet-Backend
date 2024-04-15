const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
// uncomment the next line to change base path
// client.basePath = "https://some-other-host"

const api = new GateApi.FuturesApi(client);
const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency
const contract = "BSV_USDT"; // string | Futures contract
const opts = {
  'limit': 10 // number | Maximum number of records to be returned in a single list
};
api.listFuturesFundingRateHistory(settle, contract, opts)
   .then(value => {
       console.log('API called successfully. Returned data: ');
       value.body.forEach(record => {
           const fundingTimeUTC = new Date(record.t * 1000).toUTCString();
           console.log(`Funding time (UTC): ${fundingTimeUTC}, Rate: ${record.r}`);
       });
   }, error => console.error(error));