const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const bcrypt = require('bcrypt');
const hiringDbConnection = require('./hiringDb');

const seedOrgPassword = async () => {
    try {
        const orgCode = 'IITB';
        const password = `${orgCode}_dcfp`;
        console.log(`Setting password for ${orgCode} to: ${password}`);

        const passwordHash = await bcrypt.hash(password, 10);

        // Find existing IITB org or create dummy one if not exists
        let org = await Organization.findOne({ code: orgCode });

        if (!org) {
            console.log('Org not found, creating new one...');
            org = new Organization({
                name: 'IIT Bombay',
                code: orgCode,
                emailDomainWhitelist: ['iitb.ac.in'],
                isActive: true
            });
        }

        // Update admin password
        org.adminPassword = passwordHash;

        // Ensure formVar1 is initialized if missing (fix for other parts of app)
        if (!org.formVar1) org.formVar1 = [];

        await org.save();
        console.log(`✅ Organization Updated: ${orgCode} / ${password}`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedOrgPassword();
