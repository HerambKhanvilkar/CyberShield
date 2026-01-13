const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const URI = 'mongodb+srv://Vikas:foobar@badgeviewer.hn2lplb.mongodb.net/Hiring';

const run = async () => {
    try {
        console.log('🚀 Connecting to Cloud DB (Hiring)...');
        const conn = await mongoose.createConnection(URI).asPromise();
        console.log('✅ Connected.');

        const OrgModel = conn.model('Organization', new mongoose.Schema({
            code: String,
            name: String,
            adminPassword: { type: String, select: '+adminPassword' },
            emailDomainWhitelist: [String],
            isActive: Boolean
        }, { strict: false, timestamps: true }), 'organizations');

        const orgCode = 'IITB';
        const password = `${orgCode}_dcfp`;
        console.log(`Checking for ${orgCode}...`);

        let org = await OrgModel.findOne({ code: orgCode });

        if (!org) {
            console.log('🆕 IITB not found. Creating...');
            org = new OrgModel({
                code: orgCode,
                name: 'IIT Bombay',
                isActive: true,
                emailDomainWhitelist: ['iitb.ac.in']
            });
        } else {
            console.log('✅ Found existing IITB org.');
        }

        const hash = await bcrypt.hash(password, 10);
        org.adminPassword = hash;

        await org.save();
        console.log(`🔐 Password set for ${orgCode} to ${password}`);

        // List all orgs just to show user
        const all = await OrgModel.find({});
        console.log(`\n📋 Current Organizations in Cloud DB (${all.length}):`);
        all.forEach(o => console.log(`   - [${o.code}] ${o.name}`));

        await conn.close();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
