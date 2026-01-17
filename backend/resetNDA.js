const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const FellowshipProfile = require('./models/FellowshipProfile');

async function reset() {
    await mongoose.connect(process.env.HIRING_MONGO_URI);
    const result = await FellowshipProfile.updateOne(
        { email: "aryan.lomte@somaiya.edu" },
        {
            $set: {
                "nda.dateTimeUser": "0",
                "onboardingState": "NDA"
            }
        }
    );
    console.log("Reset Result:", result);
    await mongoose.connection.close();
}

reset().catch(console.error);
