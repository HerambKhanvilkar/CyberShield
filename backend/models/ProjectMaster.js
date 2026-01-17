const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const ProjectMasterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = hiringDbConnection.model('ProjectMaster', ProjectMasterSchema);
