const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const Applicant = require('./models/Applicant');
const hiringDbConnection = require('./hiringDb');

async function checkState() {
    try {
        const orgs = await Organization.find();
        console.log("=== Organizations ===");
        orgs.forEach(o => console.log(`- Code: ${o.code}, Name: ${o.name}, EndDate: ${o.endDate}`));

        const apps = await Applicant.find();
        console.log("\n=== Applicants ===");
        apps.forEach(a => console.log(`- Email: ${a.email}, OrgCode: ${a.orgCode}, Status: ${a.status}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkState();
