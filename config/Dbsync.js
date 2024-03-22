const db = require('./Database.js'); 
const Users = require('../models/UserModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const UserPDFs = require('../models/UserPDFsModel.js');
const Scans = require('../models/ScansModel.js');

db.sync({ force: true }, { alter: true })
    .then(() => console.log('Tables have been created'))
    .catch(error => console.log('Error occurred:', error));

// db.sync({ alter: true })