const GateApi = require('gate-api');
const client = require('./gateClient');

async function setDualMode(settle, mode) {
  try {
    const apiInstance = new GateApi.FuturesApi(client);
    const dualMode = mode; // Boolean | Whether to enable dual mode
    const response = await apiInstance.setDualMode(settle, dualMode);
    console.log(`Dual mode set to ${dualMode} for ${settle}`, response.body);
  } catch (error) {
    console.error(
      `Error setting dual mode for ${settle}: ${error}`,
      error.response
    );
  }
}

// setDualMode("usdt", true); // Enable dual mode
setDualMode("usdt", false); // Disable dual mode