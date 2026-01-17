const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const ApplicantSchema = new mongoose.Schema({
    orgCode: {
        type: String,
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    project: {
        type: String,
        required: false
    },
    data: {
        type: Object, // Any other form data
        default: {}
    },
    assignedEmail: {
        type: String,
        default: ""
    },
    assignedPassword: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['PENDING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_SKIPPED', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING'
    },
    interviewDetails: {
        scheduledAt: Date,
        meetLink: String,
        status: {
            type: String,
            enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'SKIPPED'],
            default: 'PENDING'
        },
        scheduledBy: String
    },
    // selected = 1 (ACCEPTED), rejected = -1 (REJECTED), pending = 0 (PENDING)
    numericStatus: {
        type: Number,
        default: 0
    },
    resume: {
        type: String, // Path to resume file
        default: null
    },
    processedBy: {
        type: String, // Email of the admin who accepted/rejected
        default: ""
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = hiringDbConnection.model('Applicant', ApplicantSchema);
