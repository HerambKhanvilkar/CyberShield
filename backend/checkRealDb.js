const mongoose = require('mongoose');

// User provided: .../Hiring
// User says: hiring_db
const URI_HIRING = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';
const URI_HIRING_DB = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/hiring_db';

const run = async () => {
    try {
        console.log('🕵️‍♀️ Comparing Databases...');

        // 1. Check 'Hiring'
        try {
            const conn1 = await mongoose.createConnection(URI_HIRING).asPromise();
            const count1 = await conn1.collection('organizations').countDocuments();
            console.log(`\nStart Check [Hiring]: Found ${count1} docs in 'organizations' collection.`);
            await conn1.close();
        } catch (e) { console.log('Error checking Hiring:', e.message); }

        // 2. Check 'hiring_db'
        try {
            const conn2 = await mongoose.createConnection(URI_HIRING_DB).asPromise();
            const count2 = await conn2.collection('organizations').countDocuments();
            console.log(`\nStart Check [hiring_db]: Found ${count2} docs in 'organizations' collection.`);

            if (count2 > 0) {
                const docs = await conn2.collection('organizations').find({}).toArray();
                docs.forEach(d => console.log(`   - [${d.code}] ${d.name}`));
            }
            await conn2.close();
        } catch (e) { console.log('Error checking hiring_db:', e.message); }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
