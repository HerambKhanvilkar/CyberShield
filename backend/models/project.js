const mongoose = require('mongoose');
const projectDBconnection = require('./connectiondb/projectsDB');
const { unique } = require('agenda/dist/job/unique');

const projectSchema = new mongoose.Schema({
    title:{
        type: String,
        require: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: "New Project Description Here"
    },
    supportedLinks: [
        {
            linkName: {
                type: String,
                trim: true
            },
            url: {
                type: String,
                trim: true
            }
        }
    ],
    contributors: [
        {
            globalPid: {
                type: String,
                trim: true
            },
            firstName: {
                type: String,
                trim: true
            }
        }
    ],
    isActive: {
        type: Boolean,
        require: true,
        default: true
    },
}, {timestamps: true});

module.exports = projectDBconnection.model('Project', projectSchema);