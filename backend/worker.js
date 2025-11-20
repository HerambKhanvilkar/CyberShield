const Agenda = require('agenda');
const mongoConnectionString = process.env.MONGO_URI;  // update with your MongoDB connection string

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'jobs' },
  processEvery: '10 seconds'
});

// Load all job definitions.
require('./jobs/csvProcessing')(agenda);
require('./jobs/reprocessRevision')(agenda);
// Admin daily report job
require('./jobs/adminDailyReport')(agenda);

agenda.on('ready', () => {
  console.log("Agenda started!");
  agenda.start();
  // Schedule the admin daily report if not already scheduled.
  // Runs once every 24 hours.
  (async () => {
    try {
      await agenda.every('24 hours', 'admin daily report');
      console.log('Scheduled admin daily report (every 24 hours)');
    } catch (err) {
      console.error('Failed to schedule admin daily report:', err);
    }
  })();
});

module.exports = agenda;
