const GateApi = require('gate-api');
const client = require('./gateClient');

const api = new GateApi.FuturesApi(client);

function setLeverage(req, res) {
    const { settle= 'usdt', contract, leverage = "1" } = req.body;

    const opts = {
        'crossLeverageLimit': leverage // string | Cross margin leverage(valid only when `leverage` is 0)
    };

    api.updatePositionLeverage(settle, contract, 0, opts)
        .then(response => {
            console.log('Leverage changed successfully', response.body);
            res.json(response.body);
        })
        .catch(error => {
            console.error(error.response.data);
            res.status(500).json({ error: error.response.data });
        });
}

module.exports = setLeverage;

