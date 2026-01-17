const mongoose = require('mongoose');
require('dotenv').config();

const hiringDbConnection = require('./hiringDb');
const ApplicantSchema = new mongoose.Schema({}, { strict: false });
const Applicant = hiringDbConnection.model('Applicant', ApplicantSchema);

async function check() {
    try {
        const applicants = await Applicant.find({}, 'email status');
        console.log("Found Applicants:", JSON.stringify(applicants, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
        hiringDbConnection.close();
    }
}

check();
