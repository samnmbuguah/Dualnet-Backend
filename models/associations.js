const MatchingPairs = require('./MatchingPairsModel');
const Scans = require('./ScansModel');

// Define the relationships
MatchingPairs.hasOne(Scans, { foreignKey: 'matchingPairId' });
Scans.belongsTo(MatchingPairs, { foreignKey: 'matchingPairId' });