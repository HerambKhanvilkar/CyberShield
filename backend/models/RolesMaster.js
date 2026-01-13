const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb');

const RolesMasterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'Custom',
        enum: ['Technical', 'Design', 'Management', 'Research', 'Custom']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = hiringDbConnection.model('RolesMaster', RolesMasterSchema);
