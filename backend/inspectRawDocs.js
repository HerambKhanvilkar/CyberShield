const mongoose = require('mongoose');

const URI = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';

const run = async () => {
    try {
        const conn = await mongoose.createConnection(URI).asPromise();
        console.log('✅ Connected.');

        const docs = await conn.db.collection('organizations').find({}).toArray();
        console.log(`\n📚 Raw Documents Found: ${docs.length}`);

        docs.forEach(d => {
            console.log(JSON.stringify(d));
        });

        await conn.close();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
