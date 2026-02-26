const mongoose = require('mongoose');

const projectsDB = mongoose.createConnection(process.env.PROJECTSDB_MONGO_URI || 'mongodb://localhost:27017/projects_db');

projectsDB.on('connected', () => {
    console.log('Connected to projectsDB');
});

projectsDB.on('error', (err) =>{
    console.log('ProjectsDB connection error:', err);
});

module.exports = projectsDB;