const mongoose = require('mongoose');
require('dotenv').config();

const hiringDbConnection = require('./hiringDb');
const ApplicantSchema = new mongoose.Schema({}, { strict: false });
const Applicant = hiringDbConnection.model('Applicant', ApplicantSchema);

async function check() {
    try {
        const applicant = await Applicant.findOne({ email: 'aryan.lomte@somaiya.edu' });
        console.log("Applicant Detials:", JSON.stringify(applicant, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
        hiringDbConnection.close();
    }
}

check();
