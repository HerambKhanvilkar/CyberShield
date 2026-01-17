const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const FellowshipProfile = require('./models/FellowshipProfile');

async function check() {
    await mongoose.connect(process.env.HIRING_MONGO_URI);
    const profile = await FellowshipProfile.findOne({ globalPid: "F00007" });
    if (!profile) {
        console.log("No profile found with PID F00007");
    } else {
        console.log("FOUND_PID_F00007");
        console.log("EMAIL:", profile.email);
        console.log("LASTNAME:", profile.lastName);
        console.log("FIRSTNAME:", profile.firstName);
    }
    await mongoose.connection.close();
}

check().catch(console.error);
