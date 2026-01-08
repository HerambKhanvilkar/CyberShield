const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const DocumentTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }, // e.g., "NDA_TEMPLATE_V2"
    type: {
        type: String,
        enum: ['NDA', 'OFFER_LETTER', 'COMPLETION_LETTER'],
        required: true
    },
    version: {
        type: String,
        default: "1.0"
    },
    templatePath: {
        type: String,
        required: true
    }, // e.g., /uploads/templates/NDA_V2.pdf
    placeholders: [{
        type: String
    }], // e.g., ["{{FULL_NAME}}", "{{ROLE}}"]
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String
    } // Admin email
}, { timestamps: true });

module.exports = hiringDbConnection.model('DocumentTemplate', DocumentTemplateSchema);
