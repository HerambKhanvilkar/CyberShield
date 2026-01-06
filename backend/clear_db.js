const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Otp = require('./models/Otp');
const Badge = require('./models/Badge');

async function clearDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const userResult = await User.deleteMany({});
        console.log(`Deleted ${userResult.deletedCount} users.`);

        const otpResult = await Otp.deleteMany({});
        console.log(`Deleted ${otpResult.deletedCount} OTP records.`);

        const badgeResult = await Badge.deleteMany({});
        console.log(`Deleted ${badgeResult.deletedCount} badges.`);

        console.log('Database cleared (Users, Otps, Badges).');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error clearing database:', err);
    }
}

clearDatabase();
