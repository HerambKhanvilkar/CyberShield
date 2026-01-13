const mongoose = require('mongoose');
require('dotenv').config();

const HIRING_URI = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';
const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/badge_viewer_default';

// Schema definition (copy-paste to be independent)
const OrgSchema = new mongoose.Schema({
    code: String,
    name: String
}, { strict: false });

const run = async () => {
    try {
        console.log('🕵️‍♀️ Investigating Database Mismatch...');

        // 1. Check Hiring DB
        console.log('\n--- Checking HIRING DB ---');
        try {
            const hiringConn = await mongoose.createConnection(HIRING_URI).asPromise();
            console.log('✅ Connected to Hiring DB');
            const HiringOrg = hiringConn.model('Organization', OrgSchema);
            const hiringOrgs = await HiringOrg.find({});
            console.log(`📊 Found ${hiringOrgs.length} orgs:`);
            hiringOrgs.forEach(o => console.log(`   - [${o.code}] ${o.name}`));
            await hiringConn.close();
        } catch (e) { console.error('❌ Hiring DB Error:', e.message); }

        // 2. Check Default DB (Try to guess if env missing)
        console.log('\n--- Checking DEFAULT DB (env.MONGODB_URI) ---');
        // We can't know the real URI if we can't read .env, but we can try the one user might have set
        // Or just ask the user.
        // Assuming common pattern 'test' or similar if they are using Atlas default.

        // Actually, let's try to connect to the "Hiring" URI but change DB name to "test" or "admin"
        const baseUri = HIRING_URI.replace('/Hiring', '/test');
        console.log(`(Trying inferred URI: ${baseUri.replace(/:.*@/, ':****@')})`);

        try {
            const defaultConn = await mongoose.createConnection(baseUri).asPromise();
            console.log('✅ Connected to Inferred Default DB (test)');
            const DefaultOrg = defaultConn.model('Organization', OrgSchema);
            const defaultOrgs = await DefaultOrg.find({});
            console.log(`📊 Found ${defaultOrgs.length} orgs:`);
            defaultOrgs.forEach(o => console.log(`   - [${o.code}] ${o.name}`));
            await defaultConn.close();
        } catch (e) {
            console.log('⚠️ Could not check ' + baseUri);
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
