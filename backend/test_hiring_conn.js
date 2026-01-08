require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

console.log("Testing connection to:", process.env.HIRING_MONGO_URI);

const hiringDbConnection = mongoose.createConnection(process.env.HIRING_MONGO_URI);

hiringDbConnection.on('connected', () => {
    console.log('SUCCESS: Connected to Hiring MongoDB');
    hiringDbConnection.close().then(() => {
        console.log("Connection closed.");
        process.exit(0);
    });
});

hiringDbConnection.on('error', (err) => {
    console.error('ERROR: Hiring MongoDB connection error:', err);
    process.exit(1);
});

// Timeout if it takes too long
setTimeout(() => {
    console.error("TIMEOUT: Could not connect within 10 seconds.");
    process.exit(1);
}, 10000);
