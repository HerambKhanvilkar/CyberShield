const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkAndDeleteUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Main DB");

        const email = 'aryan.lomte@somaiya.edu';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`Found user: ${user._id}, Email: ${user.email}`);
            await User.deleteOne({ _id: user._id });
            console.log("User deleted successfully.");
        } else {
            console.log("No user found with that email in the main DB.");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAndDeleteUser();
