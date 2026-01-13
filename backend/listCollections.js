const mongoose = require('mongoose');

const URI = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';

const run = async () => {
    try {
        console.log('Connecting...');
        const conn = await mongoose.createConnection(URI).asPromise();
        console.log('✅ Connected.');

        // List collections
        const collections = await conn.db.listCollections().toArray();
        console.log('\n📚 Collections found:');

        for (const col of collections) {
            const count = await conn.db.collection(col.name).countDocuments();
            console.log(`- ${col.name} (${count} docs)`);

            // Peek at first doc if it looks like org
            if (col.name.toLowerCase().includes('org')) {
                const first = await conn.db.collection(col.name).findOne();
                console.log(`  Sample: ${JSON.stringify(first).substring(0, 100)}...`);
            }
        }

        await conn.close();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
