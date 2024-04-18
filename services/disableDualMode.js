const GateApi = require('gate-api');
const client = require('./gateClient');

async function disableDualMode(settle) {
    try {
        const apiInstance = new GateApi.FuturesApi(client);
        const dualMode = false; // Boolean | Whether to enable dual mode
        const response = await apiInstance.setDualMode(settle, dualMode);
        console.log(`Dual mode disabled for ${settle}`, response.body);
    } catch (error) {
        console.error(`Error disabling dual mode for ${settle}: ${error}`, error.response);
    }
}

disableDualMode('usdt',   true);