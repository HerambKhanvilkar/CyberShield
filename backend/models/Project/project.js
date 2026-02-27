const mongoose = require('mongoose');
const projectDBconnection = require('../connectiondb/projectsDB');

const projectSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
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
            firstName: {
                type: String,
                trim: true
            },
            email: {
                type: String,
                trim: true,
            },
            role: {
                type: String,
                trim: true,
            }
        }
    ],
    status: {
        type: String,
        trim: true,
    }
}, {timestamps: true});

module.exports = projectDBconnection.model('Project', projectSchema);