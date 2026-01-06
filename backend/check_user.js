const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'aryan.lomte@somaiya.edu';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:', {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            });
        } else {
            console.log('User not found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
