require('dotenv').config();
const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
const API_KEY= process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

client.setApiKeySecret(API_KEY, API_SECRET);

module.exports = client;