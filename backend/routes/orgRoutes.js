const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const Applicant = require('../models/Applicant');
const { authenticateJWT } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// middleware to check if user is Org Admin
const isOrgAdmin = (req, res, next) => {
    if (req.user && req.user.isOrgAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Organization Admin only.' });
    }
};

// @route   POST /api/org/login
// @desc    Login for Organization Admin (OrgCode + Password)
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { orgCode, password } = req.body;

        // validate inputs
        if (!orgCode || !password) {
            return res.status(400).json({ message: 'Please provide Org Code and Password' });
        }

        // Check for organization AND include adminPassword (selected false by default)
        const org = await Organization.findOne({ code: orgCode, isActive: true }).select('+adminPassword');

        if (!org) {
            return res.status(400).json({ message: 'Invalid Organization Code' });
        }

        if (!org.adminPassword) {
            return res.status(400).json({ message: 'Organization has not been initialized for portal access.' });
        }

        const isMatch = await bcrypt.compare(password, org.adminPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        // Create token
        const token = jwt.sign(
            {
                id: org._id,
                name: org.name,
                orgCode: org.code,
                isOrgAdmin: true
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        org.adminLastLogin = Date.now();
        await org.save();

        res.json({
            token,
            user: {
                id: org._id,
                name: org.name,
                orgCode: org.code,
                role: 'ADMIN'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/org/stats
// @desc    Get dashboard stats
router.get('/stats', authenticateJWT, isOrgAdmin, async (req, res) => {
    try {
        const orgCode = req.user.orgCode;
        // Count stats using referralCode matching orgCode
        const totalApplicants = await Applicant.countDocuments({ orgCode: orgCode });
        const pending = await Applicant.countDocuments({ orgCode: orgCode, status: 'PENDING' });
        const accepted = await Applicant.countDocuments({ orgCode: orgCode, status: { $in: ['ACCEPTED', 'SHORTLISTED'] } });
        const rejected = await Applicant.countDocuments({ orgCode: orgCode, status: 'REJECTED' });

        res.json({
            metrics: { totalApplicants, pending, accepted, rejected },
            lastUpdated: new Date()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/org/applicants
// @desc    Get list of applicants
router.get('/applicants', authenticateJWT, isOrgAdmin, async (req, res) => {
    try {
        const orgCode = req.user.orgCode;
        const applicants = await Applicant.find({ orgCode: orgCode })
            .select('firstName lastName email status role appliedAt')
            .sort({ appliedAt: -1 });
        res.json(applicants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
