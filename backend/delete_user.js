const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function deleteUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'aryan.lomte@somaiya.edu';
        const result = await User.deleteOne({ email });

        if (result.deletedCount > 0) {
            console.log(`Successfully deleted user with email: ${email}`);
        } else {
            console.log(`User with email: ${email} not found or already deleted.`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

deleteUser();
