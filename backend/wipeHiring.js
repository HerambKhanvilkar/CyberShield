const mongoose = require('mongoose');
require('dotenv').config();
const hiringDbConnection = require('./hiringDb');

// Import models to ensure they are registered with the hiringDbConnection
const Organization = require('./models/Organization');
const Applicant = require('./models/Applicant');
const FellowshipProfile = require('./models/FellowshipProfile');
const HiringAuditLog = require('./models/HiringAuditLog');

async function clearDb() {
    try {
        console.log("Connecting to Hiring DB for wipe...");

        // Wait for connection
        if (hiringDbConnection.readyState !== 1) {
            await new Promise((resolve) => hiringDbConnection.once('connected', resolve));
        }

        console.log("Wiping collections...");

        await Applicant.deleteMany({});
        console.log("- Deleted all Applicants");

        await FellowshipProfile.deleteMany({});
        console.log("- Deleted all Fellowship Profiles");

        await Organization.deleteMany({});
        console.log("- Deleted all Organizations");

        await HiringAuditLog.deleteMany({});
        console.log("- Deleted all Hiring Audit Logs");

        console.log("Hiring DB Wiped Successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Wipe Failed:", error);
        process.exit(1);
    }
}

clearDb();
