const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const hiringDbConnection = require('./hiringDb');

const checkOrgs = async () => {
    try {
        console.log('🔍 checking Organizations in Hiring DB...');
        const orgs = await Organization.find({}).select('+adminPassword');
        console.log(`Found ${orgs.length} organizations:`);
        orgs.forEach(o => {
            console.log(`- [${o.code}] ${o.name} (Active: ${o.isActive})`);
            console.log(`  AdminPassword Set: ${!!o.adminPassword}`);
        });

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkOrgs();
