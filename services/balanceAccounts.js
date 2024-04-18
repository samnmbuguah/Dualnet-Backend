const GateApi = require('gate-api');
const Transfer = GateApi.Transfer;
const client = require('./gateClient');
const fetchBothBalances = require('./fetchBalances');
const api = new GateApi.WalletApi(client);

async function transferFunds(from, to, amount) {
  const transfer = new Transfer();
  transfer.from = from;
  transfer.to = to;
  transfer.currency = 'USDT';
  transfer.amount = amount.toString();
  transfer.settle = 'USDT';

  return api.transfer(transfer)
    .then(value => {
      console.log('API called successfully. Returned data: ', value.body);
      return value.body;
    })
    .catch(error => {
      if (error.response) {
        console.error('Error message: ', error.response.data.message);
        console.error('Error code: ', error.response.status);
      } else {
        console.error('Error: ', error.message);
      }
    });
}

async function balanceAccounts() {
  const [spotBalances, futuresBalances] = await fetchBothBalances(18);

  const spotUsdtBalance = parseFloat(spotBalances) || 0;
  const futuresUsdtBalance = parseFloat(futuresBalances) || 0;

  const difference = Math.abs(spotUsdtBalance - futuresUsdtBalance) / 2;
  const amount = Math.round(difference * 100) / 100;

  if (spotUsdtBalance > futuresUsdtBalance) {
    await transferFunds('spot', 'futures', amount);
  } else if (spotUsdtBalance < futuresUsdtBalance) {
    await transferFunds('futures', 'spot', amount);
  }
}

balanceAccounts()
  .then(() => console.log('Balancing completed'))
  .catch(error => console.error('Error during balancing:', error));