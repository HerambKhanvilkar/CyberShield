require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('./models/Organization'); // Now uses hiringDb
const User = require('./models/User');
const bcrypt = require('bcrypt');
const hiringDbConnection = require('./hiringDb');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Main MongoDB...");

        // Wait for hiring DB connection
        await new Promise((resolve) => {
            if (hiringDbConnection.readyState === 1) resolve();
            else hiringDbConnection.on('connected', resolve);
        });
        console.log("Connected to Hiring MongoDB...");

        // 1. Seed Organization
        const orgData = {
            code: "CODE123",
            name: "DeepCytes Fellowship 2025",
            emailDomainWhitelist: ["@gmail.com", "@deepcytes.io", "@outlook.com", "@somaiya.edu"], // Common domains for testing
            endDate: new Date('2030-01-01'), // Future date for testing
            formVar1: ["Cybersecurity Analyst", "Penetration Tester", "Security Researcher"],
            formVar2: {
                "Cybersecurity Analyst": ["SOC Automation", "Threat Intelligence Platform"],
                "Penetration Tester": ["Web App Pentest", "Network Vulnerability Assessment"],
                "Security Researcher": ["Malware Analysis", "Cryptography Research"]
            }
        };

        // Check if exists
        let org = await Organization.findOne({ code: orgData.code });
        if (org) {
            console.log("Organization 'CODE123' already exists. Updating...");
            Object.assign(org, orgData);
            await org.save();
        } else {
            console.log("Creating Organization 'CODE123'...");
            await Organization.create(orgData);
        }

        // 2. Seed Portal User
        const userData = {
            email: "portal.test@deepcytes.io",
            firstName: "Portal",
            lastName: "User",
            password: "Password123!", // Initial password, though they use OTP
            isAdmin: false,
            ndaDateTimeUser: "0", // Not signed
            pid: ""
        };

        let user = await User.findOne({ email: userData.email });
        if (user) {
            console.log(`User '${userData.email}' already exists.`);
        } else {
            console.log(`Creating User '${userData.email}'...`);
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;
            await User.create(userData);
        }

        // Seed an Admin User for reviewing applications
        const adminData = {
            email: "admin@deepcytes.io",
            firstName: "Admin",
            lastName: "DeepCytes",
            password: "AdminPassword123!",
            isAdmin: true
        };

        let admin = await User.findOne({ email: adminData.email });
        if (!admin) {
            console.log(`Creating Admin '${adminData.email}'...`);
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            adminData.password = hashedPassword;
            await User.create(adminData);
        }

        console.log("Seeding Completed Successfully!");
        process.exit(0);

    } catch (err) {
        console.error("Seeding Failed:", err);
        process.exit(1);
    }
};

seedData();
