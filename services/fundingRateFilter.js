const MatchingPairs = require('../models/MatchingPairsModel.js');
const { Op } = require('sequelize');

async function countMatchingPairs() {
    const count = await MatchingPairs.count({
        where: {
            fundingRate: {
                [Op.gt]: 0.25
            }
        }
    });

    console.log(`Number of matching pairs with a funding rate : ${count}`);
}

countMatchingPairs();