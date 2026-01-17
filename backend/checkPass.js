const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const FellowshipProfile = require('./models/FellowshipProfile');

async function check() {
    await mongoose.connect(process.env.HIRING_MONGO_URI);
    const profiles = await FellowshipProfile.find({ lastName: /Lomte/i });
    console.log(`FOUND_PROFILES: ${profiles.length}`);

    for (const p of profiles) {
        console.log(`[PROFILE_DATA]`);
        console.log(`EMAIL: ${p.email}`);
        console.log(`PID: ${p.globalPid}`);
        console.log(`STATE: ${p.onboardingState}`);
        console.log(`NDA_SIGNED: ${p.nda.dateTimeUser}`);
        if (p.tenures && p.tenures[0] && p.tenures[0].signedDocuments) {
            console.log(`PATH: ${p.tenures[0].signedDocuments.nda?.pdfPath}`);
        }
        console.log(`---`);
    }
    await mongoose.connection.close();
}

check().catch(console.error);
