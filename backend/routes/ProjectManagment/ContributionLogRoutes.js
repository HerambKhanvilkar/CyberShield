const express = require('express');
const router = express.Router();
const ContributionLog = require('../../models/Project/ContributionLog');
const projectContributionLogController = require('../../controllers/projectContributionLogController');
const fellowshipProfileModel = require('../../models/FellowshipProfile');
const { authenticateJWT, isAdmin} = require('../../middleware/auth');


// Get all contribution logs for a project, sorted by latest first
router.get('/logs/:projectId', authenticateJWT, async (req, res) => {
	try {
		const logs = await ContributionLog.find({
			projectId: req.params.projectId
		}).sort({ createdAt: -1 }).populate('profileId');
		res.json(logs);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// 1️⃣ Get Active Contributors of a Project
router.get('/active-contributors/:projectId', authenticateJWT, async (req, res) => {
	try {
		const contributors = await ContributionLog.find({
			projectId: req.params.projectId,
			isActive: true
		}).populate('profileId');
		res.json(contributors);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// 2️⃣ Get All Active Projects of a Profile
router.get('/active-projects/:profileId', authenticateJWT, async (req, res) => {
	try {
		const projects = await ContributionLog.find({
			profileId: req.params.profileId,
			isActive: true
		}).populate('projectId');
		res.json(projects);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// 3️⃣ Get Full History of a Contributor
router.get('/history/:profileId', authenticateJWT, async (req, res) => {
	try {
		const history = await ContributionLog.find({
			profileId: req.params.profileId
		}).sort({ joinedAt: 1 });
		res.json(history);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// 4️⃣ Calculate Total Time Spent in a Project by a Profile
router.get('/total-time/:projectId/:profileId', authenticateJWT, async (req, res) => {
	try {
		const logs = await ContributionLog.find({
			projectId: req.params.projectId,
			profileId: req.params.profileId
		});
		let totalMs = 0;
		const now = new Date();
		logs.forEach(log => {
			const start = log.joinedAt;
			const end = log.leftAt ? log.leftAt : now;
			totalMs += end - start;
		});
		// Return total time in milliseconds and human readable format
		const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
		res.json({ totalMs, totalDays });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Join a contributor to a project
router.post('/join', authenticateJWT, isAdmin, async (req, res) => {
	const { projectId, profileId, role } = req.body;
	if (!projectId || !profileId || !role) {
		return res.status(400).json({ error: 'projectId, profileId, and role are required.' });
	}
	try {
		await projectContributionLogController.markContributorJoin(projectId, profileId, role);
		res.json({ message: 'Contributor joined project.' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Mark contributor as left a project
router.post('/leave', authenticateJWT, isAdmin, async (req, res) => {
	const { projectId, profileId } = req.body;
	if (!projectId || !profileId) {
		return res.status(400).json({ error: 'projectId and profileId are required.' });
	}
	try {
		await projectContributionLogController.markContributorLeave(projectId, profileId);
		res.json({ message: 'Contributor marked as left project.' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;