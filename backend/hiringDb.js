const mongoose = require('mongoose');

const hiringDbConnection = mongoose.createConnection(process.env.HIRING_MONGO_URI || 'mongodb://localhost:27017/hiring_db');

hiringDbConnection.on('connected', () => {
    console.log('Connected to Hiring MongoDB');
});

hiringDbConnection.on('error', (err) => {
    console.error('Hiring MongoDB connection error:', err);
});

module.exports = hiringDbConnection;
