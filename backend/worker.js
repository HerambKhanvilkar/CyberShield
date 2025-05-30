const Agenda = require('agenda');
const mongoConnectionString = process.env.MONGO_URI;  // update with your MongoDB connection string

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'jobs' },
  processEvery: '10 seconds'
});

// Load all job definitions.
require('./jobs/csvProcessing')(agenda);

agenda.on('ready', () => {
  console.log("Agenda started!");
  agenda.start();
});

module.exports = agenda;
