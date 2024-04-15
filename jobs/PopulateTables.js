const dotenv = require('dotenv');
dotenv.config();
const cron = require('node-cron');
const MatchingPairs = require('../models/MatchingPairsModel.js');
const Scans = require('../models/ScansModel.js');
const findMatchingPairs = require( '../services/GateioServices.js');
async function populateTables() {
    console.log('Populating tables...');

    try {
        // Fetch matching pairs from Gate.io API
        const matchingPairs = (await findMatchingPairs()).filter(pair => pair !== null);

        // Insert data into tables
        if (matchingPairs) {
            await MatchingPairs.bulkCreate(matchingPairs, { updateOnDuplicate: ['fundingRate', 'precision', 'amountPrecision', 'fee'] });
            console.log("Inserted",matchingPairs.length,"matching pairs into the MatchingPairs table");
        } else {
            console.log("No matching pairs found");
        }

        // Fetch fundingRate from MatchingPairs and update Scans
        const scansCount = await Scans.count();
        if (scansCount === 0) {
            // If the Scans table is empty, create a new Scan for each MatchingPair
            const newScans = matchingPairs.map(pair => ({
                matchingPairId: pair.id,
                fundingRate: pair.fundingRate,
                quantoMultiplier: pair.quantoMultiplier,
                leverageMin: pair.leverageMin,
                leverageMax: pair.leverageMax,
                maintenanceRate: pair.maintenanceRate,
                makerFeeRate: pair.makerFeeRate,
                takerFeeRate: pair.takerFeeRate,
                fundingNextApply: pair.fundingNextApply,
                base: pair.base,
                minBaseAmount: pair.minBaseAmount,
                minQuoteAmount: pair.minQuoteAmount,
                percentageDifference: -1
            }));
            await Scans.bulkCreate(newScans);
            console.log("Created new scans for all", matchingPairs.length,"matching pairs");
        } else {
            const newScans = matchingPairs.map(pair => ({
                matchingPairId: pair.id,
                fundingRate: pair.fundingRate,
                quantoMultiplier: pair.quantoMultiplier,
                leverageMin: pair.leverageMin,
                leverageMax: pair.leverageMax,
                maintenanceRate: pair.maintenanceRate,
                makerFeeRate: pair.makerFeeRate,
                takerFeeRate: pair.takerFeeRate,
                fundingNextApply: pair.fundingNextApply,
                base: pair.base,
                minBaseAmount: pair.minBaseAmount,
                minQuoteAmount: pair.minQuoteAmount,
                percentageDifference: -1
            }));

            await Scans.bulkCreate(newScans, {
                updateOnDuplicate: ["fundingRate", "quantoMultiplier", "maintenanceRate", "makerFeeRate", "takerFeeRate", "fundingNextApply",]
            });
            console.log("Updated funding rate for all", matchingPairs.length,"scans");
        }

        console.log('Tables have been populated');
    } catch (error) {
        console.error(error);
    }
}

module.exports = populateTables;

// Run the task immediately
// populateTables();

// // Schedule the task to run at the beginning of every hour
// cron.schedule('0 * * * *', populateTables);