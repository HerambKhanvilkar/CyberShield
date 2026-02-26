const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const project = require('../models/project');

router.post('/project', authenticateJWT, isAdmin, async (req, res) => {
    try{
        const { title, description, supportedLinks, contributors, isActive } = req.body;

        // Validate required fields
        if(!title || !description || !supportedLinks || !contributors || isActive === undefined){
            return res.status(400).json({ message: "Please provide all fields" });
        }

        // Validate field types
        if(typeof title !== 'string' || typeof description !== 'string'){
            return res.status(400).json({ message: "Title and description must be strings" });
        }

        if(typeof isActive !== 'boolean'){
            return res.status(400).json({ message: "isActive must be a boolean" });
        }

        if(!Array.isArray(supportedLinks) || !Array.isArray(contributors)){
            return res.status(400).json({ message: "supportedLinks and contributors must be arrays" });
        }

        const newProject = new project({
            title,
            description,
            supportedLinks,
            contributors,
            isActive
        });

        const savedProject = await newProject.save();

        res.status(201).json({ 
            message: "Successfully created the project",
            project: savedProject
        });

    }catch(err){
        console.error('Error creating project:', err);
        res.status(500).json({ message: "Failed to create a project", error: err.message });
    }
});

router.get('/projects', authenticateJWT, async(req, res)=>{
    try{
        const projects = await project.find();

        res.status(200).json(projects);
    }catch(err){
        res.status(500).json({ message: "Failed to fetch projects" });
    }
})

module.exports = router;