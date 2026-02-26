const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const FellowshipProfileSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    assigned_role: {
        type: String,
        trim: true
    },
    globalPid: {
        type: String,
        default: "" // Assigned post-NDA: F00000 format
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'FROZEN', 'TERMINATED', 'DROPPED'],
        default: 'PENDING'
    },
    onboardingState: {
        type: String,
        enum: ['PROFILE', 'NDA', 'OFFER', 'RESOURCES', 'RESEARCH', 'FEEDBACK', 'COMPLETION'],
        default: 'PROFILE'
    },
    nda: {
        signedName: { type: String, default: "" },
        dateTimeUser: { type: String, default: "0" }, // HHMMSS DDMMYYYY
        dateTimeDC: { type: String, default: "0" },
        version: { type: String, default: "1.0" },
        pdfHash: { type: String, default: "" }
    },
    tenures: [{
        type: { type: String, default: "Fellowship" },
        role: { type: String, default: "" },
        project: { type: String, default: "" },
        orgCode: { type: String, default: "" },
        status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'FROZEN', 'UPGRADED'], default: 'ACTIVE' },
        cohort: { type: String, default: "C1" },
        startDate: { type: String, default: "" }, // DDMMYYYY
        endDate: { type: String, default: "" }, // DDMMYYYY
        offerDateTime: { type: String, default: "0" }, // HHMMSS DDMMYYYY
        completionFlag: { type: Number, default: 0 }, // 0 or 1
        completionStatus: { type: String, default: "" }, // e.g. PROMOTED, GRADUATED
        feedback: { type: mongoose.Schema.Types.Mixed, default: null }, // Changed to Mixed for Questionnaire
        promotionInfo: {
            promotedFrom: String,
            promotedTo: String
        },
        // Embedded Signed Documents for this Tenure
        signedDocuments: {
            nda: {
                signedAt: { type: String, default: "" }, // HHMMSS DDMMYYYY
                signedBy: { type: String, default: "" }, // Legal Name
                documentHash: { type: String, default: "" }, // SHA-256
                signatureData: { type: String, default: "" }, // Base64 or typed name
                signatureType: { type: String, enum: ['TYPED', 'DRAWN'], default: 'TYPED' },
                pdfPath: { type: String, default: "" } // Path to generated PDF
            },
            offerLetter: {
                signedAt: { type: String, default: "" },
                signedBy: { type: String, default: "" },
                documentHash: { type: String, default: "" },
                signatureData: { type: String, default: "" },
                signatureType: { type: String, enum: ['TYPED', 'DRAWN'], default: 'TYPED' },
                pdfPath: { type: String, default: "" }
            },
            completionLetter: {
                signedAt: { type: String, default: "" },
                signedBy: { type: String, default: "" },
                documentHash: { type: String, default: "" },
                signatureData: { type: String, default: "" },
                signatureType: { type: String, enum: ['TYPED', 'DRAWN'], default: 'TYPED' },
                pdfPath: { type: String, default: "" }
            }
        }
    }],
    socials: {
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = hiringDbConnection.model('FellowshipProfile', FellowshipProfileSchema);
