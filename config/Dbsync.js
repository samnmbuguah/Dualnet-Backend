const db = require('./Database.js'); 
const Users = require('../models/UserModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const UserPDFs = require('../models/UserPDFsModel.js');
const Scans = require('../models/ScansModel.js');
const Bots = require('../models/BotsModel.js');

Scans.sync()
    .then(() => {
        console.log('Syncing Tables');
        return Scans.sync({force: true});
    })
    .then(() => {
        console.log('Scans table has been reset');
        return Users.sync();
    })
    .then(() => {
        console.log('Users table has been synced');
        return MatchingPairs.sync({alter: true});
    })
    .then(() => {
        console.log('MatchingPairs table has been synced');
        return UserPDFs.sync();
    })
    .then(() => {
        console.log('UserPDFs table has been synced');
        return Bots.sync({alter: true});
    })
    .then(() => console.log('Bots table has been synced'))
    .catch(error => console.log('Error occurred:', error));