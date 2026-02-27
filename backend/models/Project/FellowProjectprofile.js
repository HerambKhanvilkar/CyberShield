const mongoose = require('mongoose');
const projectDBconnection = require('../connectiondb/projectsDB');

const profileSchema = new mongoose.Schema({
    fellowshipProfile_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fellowshipprofiles'
    },
    activeProject_id:[
        {   
            ref_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'projects'
            },
            role: {
                type: String,
                trim: true,
            } 
        }
    ],
    nonActiveProject_id:[
        {   
            ref_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'projects'
            },
            role: {
                type: String,
                trim: true,
            } 
        }
    ],
    
})

module.exports = projectDBconnection.model('Profile', profileSchema);