const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const OrgUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    orgCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'VIEWER'],
        default: 'ADMIN'
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Ensure orgCode is indexed for faster lookups
OrgUserSchema.index({ orgCode: 1 });

module.exports = hiringDbConnection.model('OrgUser', OrgUserSchema);
