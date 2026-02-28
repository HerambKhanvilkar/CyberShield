const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Profile = require('../../models/Project/FellowProjectprofile');
const FellowshipProfile = require('../../models/FellowshipProfile');
const projectContributionLogController = require('../../controllers/projectContributionLogController');

// Helper to get or create a Profile document for a fellowship profile id
async function getOrCreateProfileForFellowshipId(fellowshipId) {
    let profile = await Profile.findOne({ fellowshipProfile_id: fellowshipId });
    if (!profile) {
        profile = new Profile({ fellowshipProfile_id: fellowshipId });
        await profile.save();
    }
    return profile;
}

// Endpoint 1: Create FellowProjectProfile from fellowship email
// POST /project-management/profile/create
// body: { email: string }
router.post('/profile/create', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'email is required' });

        const fellowship = await FellowshipProfile.findOne({ email: email.toLowerCase().trim() });
        if (!fellowship) return res.status(404).json({ error: 'FellowshipProfile not found for provided email' });

        const profile = await getOrCreateProfileForFellowshipId(fellowship._id);
        return res.json({ success: true, profile });
    } catch (err) {
        console.error('create profile error', err);
        return res.status(500).json({ error: 'internal server error' });
    }
});

// Endpoint 2: Add active project id
// POST /project-management/profile/add-active
// body: { email: string, projectId: string, role?: string }
router.post('/profile/add-active', async (req, res) => {
    try {
        const { email, projectId, role } = req.body;
        if (!email || !projectId) return res.status(400).json({ error: 'email and projectId are required' });

        const fellowship = await FellowshipProfile.findOne({ email: email.toLowerCase().trim() });
        if (!fellowship) return res.status(404).json({ error: 'FellowshipProfile not found for provided email' });

        const ProjectProfile = await getOrCreateProfileForFellowshipId(fellowship._id);

        const projObjectId = mongoose.Types.ObjectId(projectId);

        // avoid duplicates
        const existsInActive = ProjectProfile.activeProject_id.some(p => p.ref_id && p.ref_id.equals(projObjectId));
        if (existsInActive) return res.status(409).json({ error: 'Project already present in activeProject_id' });

        ProjectProfile.activeProject_id.push({ ref_id: projObjectId, role: role || '' });
        await ProjectProfile.save();
        await projectContributionLogController.markContributorJoin(projObjectId, ProjectProfile._id, role || '');
        return res.json({ success: true, ProjectProfile });
    } catch (err) {
        console.error('add active project error', err);
        return res.status(500).json({ error: 'internal server error' });
    }
});

// Endpoint 3: Move project between active and nonActive arrays (and reverse)
// POST /project-management/profile/move-project
// body: { email: string, projectId: string, to: 'nonActive'|'active' }
router.post('/profile/move-project', async (req, res) => {
    try {
        const { email, projectId, to } = req.body;
        if (!email || !projectId || !to) return res.status(400).json({ error: 'email, projectId and to are required' });
        if (!['nonActive', 'active'].includes(to)) return res.status(400).json({ error: 'to must be "nonActive" or "active"' });

        const fellowship = await FellowshipProfile.findOne({ email: email.toLowerCase().trim() });
        if (!fellowship) return res.status(404).json({ error: 'FellowshipProfile not found for provided email' });

        const profile = await Profile.findOne({ fellowshipProfile_id: fellowship._id });
        if (!profile) return res.status(404).json({ error: 'FellowProjectProfile not found' });

        const projObjectId = mongoose.Types.ObjectId(projectId);

        if (to === 'nonActive') {
            // find in active
            const idx = profile.activeProject_id.findIndex(p => p.ref_id && p.ref_id.equals(projObjectId));
            if (idx === -1) return res.status(404).json({ error: 'Project not found in activeProject_id' });
            const item = profile.activeProject_id[idx];
            profile.nonActiveProject_id.push({ ref_id: item.ref_id, role: item.role });
            await projectContributionLogController.markContributorLeave(item.ref_id, profile._id);
            profile.activeProject_id.splice(idx, 1);
        } else {
            // move to active from nonActive
            const idx = profile.nonActiveProject_id.findIndex(p => p.ref_id && p.ref_id.equals(projObjectId));
            if (idx === -1) return res.status(404).json({ error: 'Project not found in nonActiveProject_id' });
            const item = profile.nonActiveProject_id[idx];
            profile.activeProject_id.push({ ref_id: item.ref_id, role: item.role });
            await projectContributionLogController.markContributorJoin(item.ref_id, profile._id, item.role);
            profile.nonActiveProject_id.splice(idx, 1);
        }

        await profile.save();
        return res.json({ success: true, profile });
    } catch (err) {
        console.error('move project error', err);
        return res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
