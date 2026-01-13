const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const OrganizationSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    emailDomainWhitelist: {
        type: [String], // e.g. ["@mes.ac.in", "@abc.edu"]
        default: []
    },
    endDate: {
        type: Date, // If current date > endDate, application closed
        default: 0 // 0 means open indefinitely or logic to handle
    },
    formVar1: {
        type: [String], // Array of Roles e.g. ["Developer", "Designer"] - LEGACY, use availableRoles
        default: []
    },
    availableRoles: {
        type: [String], // Selected roles from master list for this organization
        default: []
    },
    formVar2: {
        type: Map, // Map of Role -> Projects e.g. { "Developer": ["Project A", "Project B"] }
        of: [String],
        default: {}
    },
    adminPassword: {
        type: String,
        select: false
    },
    adminLastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = hiringDbConnection.model('Organization', OrganizationSchema, 'organizations');
