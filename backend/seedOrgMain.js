const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_db_name'; // Fallback if env missing

mongoose.connect(uri)
    .then(() => console.log('✅ Connected to Main DB'))
    .catch(e => console.error(e));

const Organization = require('./models/Organization');
const bcrypt = require('bcrypt');

const seedOrgPasswordMain = async () => {
    try {
        const orgCode = 'IITB'; // Or '123' or whatever exists
        // Let's first list them to be sure
        console.log('Listing Orgs in Main DB...');
        const orgs = await Organization.find({});
        console.log(`Found ${orgs.length} orgs.`);
        orgs.forEach(o => console.log(`- ${o.code} (${o.name})`));

        // Now update IITB or create it
        const password = `${orgCode}_dcfp`;
        const passwordHash = await bcrypt.hash(password, 10);

        let org = await Organization.findOne({ code: orgCode });

        if (!org) {
            console.log('IITB not found in Main DB. Creating...');
            org = new Organization({
                name: 'IIT Bombay',
                code: orgCode,
                emailDomainWhitelist: ['iitb.ac.in'],
                isActive: true
            });
        }

        org.adminPassword = passwordHash;
        if (!org.formVar1) org.formVar1 = [];

        // Ensure other fields are present if strict schema

        await org.save();
        console.log(`✅ Main DB Updated: ${orgCode} / ${password}`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedOrgPasswordMain();
