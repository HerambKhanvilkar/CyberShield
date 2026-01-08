const Applicant = require('./models/Applicant');
const hiringDbConnection = require('./hiringDb');

async function findOne() {
    try {
        const app = await Applicant.findOne();
        if (app) {
            console.log("ID:", app._id.toString());
            console.log("Email:", app.email);
            console.log("Status:", app.status);
        } else {
            console.log("No applicants found");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
findOne();
