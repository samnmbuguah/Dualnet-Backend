const db = require('./Database.js'); 
const Users = require('../models/UserModel.js');
const Contracts = require('../models/FuturesModel.js');
const Currencies = require('../models/SpotModel.js');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const UserPDFs = require('../models/UserPDFsModel.js');

db.sync()
    .then(() => console.log('Tables have been created'))
    .catch(error => console.log('Error occurred:', error));