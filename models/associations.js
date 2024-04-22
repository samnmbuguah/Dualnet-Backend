const MatchingPairs = require('./MatchingPairsModel');
const Scans = require('./ScansModel');
const Users = require("./UserModel.js");
const Bots = require("./BotsModel.js");

// Define the relationships
MatchingPairs.hasOne(Scans, { foreignKey: 'matchingPairId' });
Scans.belongsTo(MatchingPairs, { foreignKey: 'matchingPairId' });
Users.hasMany(Bots, { foreignKey: 'userId' });
Bots.belongsTo(Users, { foreignKey: 'userId' });
Scans.hasMany(Bots, { foreignKey: 'matchingPairId' });
Bots.belongsTo(Scans, { foreignKey: 'matchingPairId' });