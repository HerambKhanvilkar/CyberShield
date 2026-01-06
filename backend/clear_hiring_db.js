const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const hiringDbConnection = require('./hiringDb');
const Applicant = require('./models/Applicant');
const HiringAuditLog = require('./models/HiringAuditLog');

async function clearHiringData() {
    try {
        // The hiringDbConnection is already handling the connection, 
        // but we need to wait for it to be ready or just use the models.
        // Usually, hiringDb.js exports the connection.

        console.log('Connecting to hiring database...');

        // Ensure connection is established
        if (hiringDbConnection.readyState !== 1) {
            await new Promise((resolve, reject) => {
                hiringDbConnection.once('open', resolve);
                hiringDbConnection.once('error', reject);
            });
        }

        console.log('Connected to hiring database.');

        const applicantResult = await Applicant.deleteMany({});
        console.log(`Deleted ${applicantResult.deletedCount} applicants.`);

        const auditLogResult = await HiringAuditLog.deleteMany({});
        console.log(`Deleted ${auditLogResult.deletedCount} hiring audit logs.`);

        console.log('Hiring database cleared (Applicants, AuditLogs).');

        process.exit(0);
    } catch (err) {
        console.error('Error clearing hiring database:', err);
        process.exit(1);
    }
}

clearHiringData();
