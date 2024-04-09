const Users = require('../models/UserModel.js');

async function getApiCredentials(subClientId) {
    try {
        const user = await Users.findOne({ where: { userId: subClientId } });
        if (user) {
            console.log(`Fetched API credentials for user with id ${subClientId}`);
            return { apiKey: user.api_key, apiSecret: user.api_secret };
        } else {
            console.error(`User with id ${subClientId} not found.`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching API credentials:', error);
        return null;
    }
}

module.exports = getApiCredentials;

// getApiCredentials(1).then(console.log);