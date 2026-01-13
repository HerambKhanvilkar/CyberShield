const mongoose = require('mongoose');
const Organization = require('./models/Organization');

// Hardcode the URI provided by user
const URI = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';

const run = async () => {
    try {
        process.env.HIRING_MONGO_URI = URI;
        console.log('🔍 Checking Organization Model count with explicit collection name...');

        // Ensure hiringDb uses the URI
        // Re-require to be safe not really needed if we run fresh process
        const hiringDb = require('./hiringDb');
        await new Promise(r => hiringDb.on('connected', r));

        const count = await Organization.countDocuments();
        console.log(`✅ Organization.countDocuments() = ${count}`);

        const orgs = await Organization.find();
        console.log('List:');
        orgs.forEach(o => console.log(`- ${o.code}`));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
