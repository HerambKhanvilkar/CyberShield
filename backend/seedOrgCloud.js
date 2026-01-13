const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Organization = require('./models/Organization');

// Hardcode the URI provided by user to ensure we hit the right DB
const HIRING_URI = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';

const seedWithExplicitURI = async () => {
    try {
        console.log('Connecting to Hiring Atlas DB...');
        // We need to bypass hiringDb.js and connect explicitly to ensure we hit the cloud
        // But Organization.js imports hiringDb.js...
        // So we need to hack it: we need to make sure hiringDb.js uses THIS uri.
        // We can set process.env.HIRING_MONGO_URI before requiring Organization.js

        // Actually, Organization.js uses the connection OBJECT exported by hiringDb.js.
        // That object is created when hiringDb.js is required.
        // So if we set the env var BEFORE requiring Organization (and thus hiringDb), it might work.

        process.env.HIRING_MONGO_URI = HIRING_URI;

        // Require Organization again (might need to clear cache if it was already required, but this is a standalone script)
        // Wait, Organization.js requires hiringDb.js.

        // Let's rely on Mongoose connection logic.
        // We'll check if we can list the 7 orgs first.

        // We need to wait for connection to be ready
        // hiringDbConnection is the connection object.

        // Let's just run the query.

        // Wait, Organization.js is already required at the top. 
        // Move require down to be safe? 

    } catch (e) { console.error(e); }
};

// Re-write of the whole script to be safe
const run = async () => {
    process.env.HIRING_MONGO_URI = HIRING_URI;

    // We need to clear require cache for hiringDb to ensure it picks up the env var
    // just in case, though in a fresh node process it shouldn't matter.

    const hiringDb = require('./hiringDb');
    const Organization = require('./models/Organization');

    // Wait for connection
    await new Promise(resolve => hiringDb.on('connected', resolve));

    console.log('✅ Connected to Cloud Hiring DB');

    const orgCode = 'IITB';
    const password = `${orgCode}_dcfp`;

    console.log('🔍 verifying organizations...');
    const orgs = await Organization.find({});
    console.log(`Found ${orgs.length} orgs in Cloud DB.`);
    orgs.forEach(o => console.log(`- ${o.code}`));

    const passwordHash = await bcrypt.hash(password, 10);

    let org = await Organization.findOne({ code: orgCode });
    if (!org) {
        console.log('IITB not found, creating...');
        org = new Organization({
            name: 'IIT Bombay',
            code: orgCode,
            emailDomainWhitelist: ['iitb.ac.in'],
            isActive: true
        });
    }

    org.adminPassword = passwordHash;
    if (!org.formVar1) org.formVar1 = [];

    await org.save();
    console.log(`✅ Cloud DB Updated: ${orgCode} / ${password}`);
    process.exit();
};

run();
