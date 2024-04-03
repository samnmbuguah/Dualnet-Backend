const GateApi = require('gate-api');
const Transfer = GateApi.Transfer;
const client = require('./gateClient');
const { fetchSpotBalances, fetchFuturesBalances } = require('./fetchBalances');

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
      console.error('Error message: ', error.response.data.message);
      console.error('Error code: ', error.response.status);
    });
}

async function balanceAccounts() {
  const spotBalances = await fetchSpotBalances(client);
  const futuresBalances = await fetchFuturesBalances(client);

  const spotUsdtBalance = spotBalances.find(b => b.currency === 'USDT')?.available || 0;
  const futuresUsdtBalance = futuresBalances.available || 0;

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