const db = require('./Database.js'); 
const Users = require('../models/UserModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const UserPDFs = require('../models/UserPDFsModel.js');
const Scans = require('../models/ScansModel.js');

Scans.update({ percentageDifference: -1 }, { where: {} })
    .then(() => {
        console.log('percentageDifference in Scans table has been updated to -1');
        return db.sync();
    })
    .then(() => console.log('Tables have been synced'))
    .catch(error => console.log('Error occurred:', error));