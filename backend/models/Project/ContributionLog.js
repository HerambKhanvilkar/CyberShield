const mongoose = require('mongoose');
const projectDBconnection = require('../connectiondb/projectsDB');

const contributionLogSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    profileId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    role: {
        type: String,
        trim: true
    },
    joinedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    leftAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {timestamps: true});

/** 
 *Prevent duplicate active membership
 */

contributionLogSchema.index(
    { projectId: 1, profileId: 1, isActive: 1},
    { unique: true, partialFilterExpression: { isActive: true }}
);

module.exports = projectDBconnection.model('ContributionLog', contributionLogSchema);