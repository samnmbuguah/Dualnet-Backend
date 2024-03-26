const db = require('./Database.js'); 
const Users = require('../models/UserModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const UserPDFs = require('../models/UserPDFsModel.js');
const Scans = require('../models/ScansModel.js');

Scans.drop()
    .then(() => {
        console.log('Scans table has been dropped');
        return db.sync();
    })
    .then(() => console.log('Tables have been created'))
    .catch(error => console.log('Error occurred:', error));