const GateApi = require('gate-api');
const client = require('./gateClient');
const api = new GateApi.WalletApi(client);
const opts = {
  'currencyPair': "BTC_USDT", // string | Specify a currency pair to retrieve precise fee rate  This field is optional. In most cases, the fee rate is identical among all currency pairs
  'settle': "USDT" // 'BTC' | 'USDT' | 'USD' | Specify the settlement currency of the contract to get more accurate rate settings  This field is optional. Generally, the rate settings for all settlement currencies are the same.
};
api.getTradeFee(opts)
   .then(value => console.log('API called successfully. Returned data: ', value.body),
       error => console.error(error));
         
       