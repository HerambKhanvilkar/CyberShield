/**
 * Seed default roles into RolesMaster collection
 * Run with: node backend/seedRoles.js
 */

const mongoose = require('mongoose');
const hiringDbConnection = require('./hiringDb');
const RolesMaster = require('./models/RolesMaster');

const defaultRoles = [
    { name: 'Developer', category: 'Technical' },
    { name: 'Security Researcher', category: 'Research' },
    { name: 'Data Analyst', category: 'Technical' },
    { name: 'UI/UX Designer', category: 'Design' },
    { name: 'Project Manager', category: 'Management' },
    { name: 'DevOps Engineer', category: 'Technical' },
    { name: 'ML Engineer', category: 'Technical' },
    { name: 'Technical Writer', category: 'Technical' }
];

async function seedRoles() {
    try {
        console.log('🌱 Seeding default roles...\n');

        for (const roleData of defaultRoles) {
            const existing = await RolesMaster.findOne({ name: roleData.name });
            if (!existing) {
                await RolesMaster.create(roleData);
                console.log(`✅ Added: ${roleData.name}`);
            } else {
                console.log(`⏭️  Skipped: ${roleData.name} (already exists)`);
            }
        }

        console.log(`\n🎉 Seeding complete! Total roles: ${await RolesMaster.countDocuments()}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding roles:', error);
        process.exit(1);
    }
}

seedRoles();
