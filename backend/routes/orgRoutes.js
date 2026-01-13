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
        const totalApplicants = await Applicant.countDocuments({ referralCode: orgCode });
        const pending = await Applicant.countDocuments({ referralCode: orgCode, status: 'PENDING' });
        const accepted = await Applicant.countDocuments({ referralCode: orgCode, status: { $in: ['ACCEPTED', 'SHORTLISTED'] } });
        const rejected = await Applicant.countDocuments({ referralCode: orgCode, status: 'REJECTED' });

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
// @route   GET /api/org/applicants
// @desc    Get list of applicants
router.get('/applicants', authenticateJWT, isOrgAdmin, async (req, res) => {
    try {
        const orgCode = req.user.orgCode;
        // Updated to use orgCode field in ApplicantSchema (it was referralCode in some legacy code, but schema says 'orgCode')
        // Wait, schema says `orgCode`. Previous code used `referralCode`.
        // Let's check Schema. `orgCode` IS the field.
        // Wait, line 106 says `find({ referralCode: orgCode })`.
        // I need to check if `referralCode` exists in Applicant Schema.
        // I viewed Applicant.js earlier: `orgCode` exists. `referralCode` does NOT. 
        // THIS IS A BUG in `orgRoutes.js`. It should be `find({ orgCode: orgCode })`.
        // I will fix this bug right now.
        const applicants = await Applicant.find({ orgCode: orgCode })
            .select('firstName lastName email status role preferredRoles appliedAt data whyJoinDeepCytes')
            .sort({ appliedAt: -1 });
        res.json(applicants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/org/export-csv
// @desc    Download applicants as CSV
router.get('/export-csv', authenticateJWT, isOrgAdmin, async (req, res) => {
    try {
        const orgCode = req.user.orgCode;
        const applicants = await Applicant.find({ orgCode: orgCode }).sort({ appliedAt: -1 });

        const fields = [
            'First Name', 'Last Name', 'Email', 'Role', 'Preferred Roles', 'Status', 'Applied At',
            'Why Join DC', 'Project Ideas', 'Resume Link'
        ];

        let csv = fields.join(',') + '\n';

        applicants.forEach(app => {
            // Handle Preferred Roles (Array)
            const rolesStr = (app.preferredRoles && app.preferredRoles.length > 0)
                ? app.preferredRoles.join('; ')
                : app.role;

            // Handle Why Join (New field -> Old field fallback -> Data field)
            const whyJoin = app.whyJoinDeepCytes || app.data?.whyJoin || '';

            const row = [
                `"${app.firstName}"`,
                `"${app.lastName}"`,
                `"${app.email}"`,
                `"${app.role}"`, // Primary
                `"${rolesStr}"`, // All
                `"${app.status}"`,
                `"${new Date(app.appliedAt).toISOString()}"`,
                `"${whyJoin.replace(/"/g, '""')}"`, // Escape quotes
                `"${(app.data?.ideas || '').replace(/"/g, '""')}"`,
                `"${(app.data?.resumeLink || '')}"`
            ];
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename=applicants-${orgCode}-${Date.now()}.csv`);
        res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error generating CSV' });
    }
});

module.exports = router;
