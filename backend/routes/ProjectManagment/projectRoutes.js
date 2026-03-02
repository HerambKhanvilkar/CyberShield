const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../../middleware/auth');
const Project = require('../../models/Project/project');
const FellowProjectProfile = require('../../models/Project/FellowProjectprofile');
const FellowshipProfile = require('../../models/FellowshipProfile');
const projectContributionLogController = require('../../controllers/projectContributionLogController');

router.post('/project', authenticateJWT, isAdmin, async (req, res) => {
    try{
        //add logic to add the project id to fellow profiles 
        const { title, description, supportedLinks, contributors, status } = req.body;

        // Validate required fields
        if(!title || !description || !supportedLinks || !contributors || status === undefined){
            return res.status(400).json({ message: "Please provide all fields" });
        }

        // Validate field types
        if(typeof title !== 'string' || typeof description !== 'string' || typeof status !== 'string'){
            return res.status(400).json({ message: "Title, description and status must be strings" });
        }

        if(!Array.isArray(supportedLinks) || !Array.isArray(contributors)){
            return res.status(400).json({ message: "supportedLinks and contributors must be arrays" });
        }

        const newProject = new Project({
            title,
            description,
            supportedLinks,
            contributors,
            status
        });

        const savedProject = await newProject.save();
        const projectId = savedProject._id;
        // Add this project to each contributor's FellowProjectProfile (activeProject_id)
        try {
            for (const c of contributors) {
                if (!c || !c.email) continue;
                const email = String(c.email).toLowerCase().trim();
                const fellow = await FellowshipProfile.findOne({ email });
                if (!fellow) continue; // skip if no fellowship profile exists for this email

                let ProjectProfile = await FellowProjectProfile.findOne({ fellowshipProfile_id: fellow._id });
                if (!ProjectProfile) {
                    ProjectProfile = new FellowProjectProfile({ fellowshipProfile_id: fellow._id });
                }
                
                const already = ProjectProfile.activeProject_id.some(p => p.ref_id && p.ref_id.equals(projectId));
                if (!already) {
                    ProjectProfile.activeProject_id.push({ ref_id: projectId, role: c.role || '' });
                    await ProjectProfile.save();
                    await projectContributionLogController.markContributorJoin(projectId, ProjectProfile._id, c.role);
                }
            }
        } catch (err) {
            console.error('Error adding project to contributor profiles:', err);
            // don't fail project creation if profile updates fail
        }
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
        const projects = await Project.find();

        res.status(200).json(projects);
    }catch(err){
        res.status(500).json({ message: "Failed to fetch projects" });
    }
})

// Get a single project by id
router.get('/project/:id', authenticateJWT, async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid project ID format' });
    }
    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch project', details: err.message });
    }
});

router.patch('/project/:id', authenticateJWT, isAdmin, async(req, res) => {
    const id = req.params.id;
    const body = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({ error: "Invalid project ID format"});
    }
    if(Object.keys(req.body).length === 0){
        return res.status(400).json({ error: "Request body cannot be empty"});
    }

    // Validate status if provided (should be a string)
    if (req.body.status !== undefined && typeof req.body.status !== 'string') {
        return res.status(400).json({ error: "status must be a string" });
    }

    try{
        const PatchedProject = await Project.findOneAndUpdate(
            { _id: id },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if(!PatchedProject){
            return res.status(404).json({ error: "Project not found" });
        }

        res.status(200).json({ message: "Project updated successfully", project: PatchedProject });
    }catch(err){
        console.error('Error updating project:', err);
        return res.status(500).json({ error: "Failed to update project", details: err.message })
    }
})
module.exports = router;