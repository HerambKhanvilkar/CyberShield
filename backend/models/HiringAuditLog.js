const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const HiringAuditLogSchema = new mongoose.Schema({
    userId: {
        type: String, // Can be email or ID
        required: false
    },
    action: {
        type: String,
        required: true,
        enum: [
            'APPLICATION_SUBMIT',
            'STATUS_CHECK',
            'ADMIN_REVIEW',
            'STATUS_UPDATE',
            'INTERVIEW_SCHEDULED',
            'INTERVIEW_SKIPPED',
            'FELLOW_TERMINATE',
            'FELLOW_PROMOTE',
            'FELLOW_ADD_MANUAL',
            'ACCOUNT_ACTIVATE',
            'STATE_ADVANCE',
            'FEEDBACK_SUBMIT',
            'OTHER'
        ]
    },
    details: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = hiringDbConnection.model('HiringAuditLog', HiringAuditLogSchema);
