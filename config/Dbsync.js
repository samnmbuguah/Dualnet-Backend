const db = require('./Database.js'); 
const Users = require('../models/UserModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const UserPDFs = require('../models/UserPDFsModel.js');
const Scans = require('../models/ScansModel.js');
const Bots = require('../models/BotsModel.js');

Scans.update({ percentageDifference: -1 }, { where: {} })
    .then(() => {
        console.log('percentageDifference in Scans table has been updated to -1');
        return Users.sync();
    })
    .then(() => {
        console.log('Users table has been synced');
        return MatchingPairs.sync({force: true});
    })
    .then(() => {
        console.log('MatchingPairs table has been synced');
        return UserPDFs.sync({force: true});
    })
    .then(() => {
        console.log('Scans table has been synced');
        return Bots.sync({force: true});
    })
    .then(() => console.log('Bots table has been synced'))
    .catch(error => console.log('Error occurred:', error));