const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const Applicant = require('../models/Applicant');
const { check, validationResult } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const HiringAuditLog = require('../models/HiringAuditLog');
const crypto = require('crypto');
const Otp = require('../models/Otp'); // We will use a separate Otp if we want strictly separate DB, but for now let's use the hiringDb connection or separate Otp model
const multer = require('multer');
const path = require('path');
const FellowshipProfile = require('../models/FellowshipProfile');
const RolesMaster = require('../models/RolesMaster');
const { sendInterviewScheduledEmail, sendApplicationStatusEmail } = require('../services/emailService');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDFs allowed"), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// 1. Get Organization Details by Code (Public)
router.get('/org/:code', async (req, res) => {
    try {
        const org = await Organization.findOne({
            code: { $regex: new RegExp(`^${req.params.code}$`, 'i') },
            isActive: true
        });

        if (!org) {
            return res.status(404).json({ message: "Organization Code not found or inactive." });
        }
        // Check end date
        if (org.endDate) {
            const endDate = new Date(org.endDate);
            const now = new Date();

            // If the date is valid and in the past, it's closed
            // We ignore 0/1970 as it's the default "No End Date" representation
            if (endDate.getTime() > 0 && now > endDate) {
                return res.status(400).json({ message: "Applications have closed for this organization." });
            }
        }

        // Return only necessary fields
        res.json({
            name: org.name,
            code: org.code,
            emailDomainWhitelist: org.emailDomainWhitelist,
            formVars: {
                roles: org.formVar1,
                // projects removed per request
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 2. Submit Application (Public)
router.post('/apply', (req, res, next) => {
    upload.single('resumeFile')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error("Multer Error:", err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Resume file too large. Maximum allowed size is 5MB." });
            }
            return res.status(400).json({ message: `Upload Error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({ message: `Upload Failed: ${err.message}` });
        }

        // Everything went fine, proceed to validation and logic
        next();
    });
}, [
    check('orgCode').notEmpty().trim().escape(),
    check('email').isEmail().normalizeEmail(),
    check('firstName').notEmpty().trim().escape(),
    check('lastName').notEmpty().trim().escape(),
    check('role').optional().trim().escape(),
    check('whyJoin').optional().trim().escape(),
    check('ideas').optional().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsgs = errors.array().map(err => `${err.param || err.path}: ${err.msg}`).join(', ');
        console.error("Validation Errors:", errors.array());
        return res.status(400).json({
            errors: errors.array(),
            message: `Validation failed: ${errorMsgs}`
        });
    }

    try {
        console.log("Submission Body:", req.body);
        console.log("Submission File:", req.file);
        const { orgCode, email, firstName, lastName, role: roleRaw, roles: rolesRaw, whyJoin, ideas, data: dataRaw } = req.body;

        let data = {};
        try {
            data = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : (dataRaw || {});
        } catch (e) { }

        // Incorporate separate fields if they exist
        if (whyJoin) data.whyJoin = whyJoin;
        if (ideas) data.ideas = ideas;

        // Handle roles
        let roles = [];
        try {
            if (rolesRaw) {
                roles = typeof rolesRaw === 'string' ? JSON.parse(rolesRaw) : rolesRaw;
            }
        } catch (e) { }

        const finalRole = roles.length > 0 ? roles[0] : (roleRaw || "UNSPECIFIED");
        data.preferredRoles = roles;


        const org = await Organization.findOne({ code: orgCode });
        if (!org) return res.status(404).json({ message: "Invalid Organization Code" });

        if (org.emailDomainWhitelist && org.emailDomainWhitelist.length > 0) {
            const domain = email.split('@')[1];
            if (!org.emailDomainWhitelist.includes(domain) && !org.emailDomainWhitelist.includes("@" + domain)) {
                // Be lenient with @ prefix
                const cleanWhitelist = org.emailDomainWhitelist.map(d => d.startsWith('@') ? d.slice(1) : d);
                if (!cleanWhitelist.includes(domain)) {
                    return res.status(400).json({ message: "Email domain not allowed for this organization." });
                }
            }
        }

        // Duplicate Check (Pending Application)
        const existingApplicant = await Applicant.findOne({ email, status: { $in: ['PENDING', 'INTERVIEW_SCHEDULED'] } });
        if (existingApplicant) {
            return res.status(400).json({ message: "You already have a pending application. Please check your status in the portal." });
        }

        // We allow users with existing FellowshipProfiles to apply for new roles/tenures.
        // The acceptance logic will handle adding a new tenure to their existing profile.

        // Create Applicant
        const applicant = new Applicant({
            orgCode,
            organizationId: org._id,
            email,
            firstName,
            lastName,
            role: finalRole,
            data: data,
            resume: req.file ? `/uploads/resumes/${req.file.filename}` : (data.resume || null)
        });

        await applicant.save();

        // Audit Log (Hiring)
        await HiringAuditLog.create({
            action: "APPLICATION_SUBMIT",
            userId: email,
            details: `New application from ${email} for ${orgCode}. File: ${req.file ? 'Uploaded' : 'Link Only'}`,
            ipAddress: req.ip
        });

        res.status(201).json({ message: "Application submitted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// 3. Admin: List Applications
router.get('/admin/list', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const apps = await Applicant.find().sort({ submittedAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 4. Update Status (Admin)
router.patch('/admin/status', authenticateJWT, isAdmin, [
    check('applicantId').notEmpty(),
    check('status').isIn(['ACCEPTED', 'REJECTED'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), message: "Validation failed: " + errors.array().map(e => e.msg).join(", ") });
    }

    try {
        const { applicantId, status, tenureEndDate } = req.body;
        console.log(`[StatusUpdate] ID: ${applicantId}, Status: ${status}, tenureEndDate: ${tenureEndDate}`);

        const applicant = await Applicant.findById(applicantId);
        if (!applicant) {
            console.error(`[StatusUpdate] Applicant not found: ${applicantId}`);
            return res.status(404).json({ message: "Applicant not found" });
        }

        // Logic: Cannot accept if interview pending (unless manually skipped or completed)
        if (status === 'ACCEPTED' &&
            applicant.interviewDetails?.status === 'PENDING' &&
            applicant.status !== 'INTERVIEW_SKIPPED') {
            return res.status(400).json({
                message: "Applicant currently has a pending interview. Please complete or skip interview before accepting."
            });
        }

        applicant.status = status;
        applicant.processedBy = req.user?.email || "Unknown Admin";
        await applicant.save();
        console.log(`[StatusUpdate] Applicant status saved: ${status}`);

        // If ACCEPTED, create or update FellowshipProfile
        if (status === 'ACCEPTED') {
            console.log(`[StatusUpdate] Creating/Updating FellowshipProfile for ${applicant.email}`);
            let profile = await FellowshipProfile.findOne({ email: applicant.email.toLowerCase() });

            if (!profile) {
                console.log(`[StatusUpdate] No profile found, creating new for ${applicant.email}`);
                profile = new FellowshipProfile({
                    email: applicant.email,
                    firstName: applicant.firstName,
                    lastName: applicant.lastName,
                    status: 'PENDING',
                    onboardingState: 'PROFILE',
                    tenures: [{
                        role: applicant.role,
                        orgCode: applicant.orgCode,
                        startDate: new Date().toLocaleDateString('en-GB').replace(/\//g, ''),
                        endDate: tenureEndDate || "",
                        status: 'ACTIVE',
                        cohort: 'C1'
                    }]
                });
            } else {
                console.log(`[StatusUpdate] Profile exists for ${applicant.email}, adding tenure`);
                profile.tenures.push({
                    role: applicant.role,
                    orgCode: applicant.orgCode,
                    startDate: new Date().toLocaleDateString('en-GB').replace(/\//g, ''),
                    endDate: tenureEndDate || "",
                    status: 'ACTIVE',
                    cohort: 'C1'
                });
            }
            await profile.save();
            console.log(`[StatusUpdate] FellowshipProfile saved for ${applicant.email}`);

            // Send Acceptance Email
            await sendApplicationStatusEmail(applicant.email, 'ACCEPTED');
        } else if (status === 'REJECTED') {
            // Send Rejection Email
            await sendApplicationStatusEmail(applicant.email, 'REJECTED');
        }

        await HiringAuditLog.create({
            action: "STATUS_UPDATE",
            details: `Admin ${req.user?.email || 'System'} updated ${applicant.email} to ${status} (Tenure End: ${tenureEndDate || 'N/A'})`,
            ipAddress: req.ip
        });

        res.json({ message: `Applicant ${status} successfully.` });
    } catch (err) {
        console.error("Status Update Critical Error:", err);
        res.status(500).json({ message: "Internal server error: " + err.message });
    }
});

// 4.5 Schedule Interview
router.put('/admin/schedule-interview', authenticateJWT, isAdmin, [
    check('applicantId').notEmpty(),
    check('scheduledAt').isISO8601(),
    check('meetLink').isURL()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { applicantId, scheduledAt, meetLink } = req.body;
        const applicant = await Applicant.findById(applicantId);

        if (!applicant) return res.status(404).json({ message: "Applicant not found" });

        applicant.status = 'INTERVIEW_SCHEDULED';
        applicant.interviewDetails = {
            scheduledAt: new Date(scheduledAt),
            meetLink,
            status: 'SCHEDULED',
            scheduledBy: req.user.email
        };

        await applicant.save();

        // Send confirmation email
        await sendInterviewScheduledEmail(applicant.email, scheduledAt, meetLink);

        await HiringAuditLog.create({
            action: "INTERVIEW_SCHEDULED",
            details: `Interview scheduled for ${applicant.email} at ${scheduledAt} by ${req.user.email}`,
            ipAddress: req.ip
        });

        res.json({ message: "Interview scheduled successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// 4.6 Skip Interview
router.put('/admin/skip-interview', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { applicantId } = req.body;
        const applicant = await Applicant.findById(applicantId);
        if (!applicant) return res.status(404).json({ message: "Applicant not found" });

        applicant.status = 'INTERVIEW_SKIPPED';
        applicant.interviewDetails = { ...applicant.interviewDetails, status: 'SKIPPED' };

        await applicant.save();
        res.json({ message: "Interview step skipped" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 5. Admin: List Organizations
router.get('/admin/orgs', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const orgs = await Organization.find().sort({ createdAt: -1 });
        res.json(orgs);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 6. Admin: Create/Update Organization
router.post('/admin/orgs', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { id, name, code, emailDomainWhitelist, endDate, formVar1, availableRoles, isActive } = req.body;

        let org;
        if (id) {
            org = await Organization.findById(id);
            if (!org) return res.status(404).json({ message: "Org not found" });
        } else {
            const existing = await Organization.findOne({ code });
            if (existing) return res.status(400).json({ message: "Code already exists" });
            org = new Organization({ code });
        }

        org.name = name;
        org.emailDomainWhitelist = emailDomainWhitelist;
        // If endDate is incoming as "0" or 0, set to 0 (indefinite)
        org.endDate = (endDate === "0" || endDate === 0) ? 0 : new Date(endDate);
        org.formVar1 = formVar1 || availableRoles || [];
        org.availableRoles = availableRoles || formVar1 || [];
        org.isActive = isActive;

        await org.save();
        res.json(org);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 5. Check Status (Public) - Verify via OTP
router.post('/check-status', [
    check('email').isEmail(),
    check('otp').notEmpty()
], async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Re-using common Otp model for now (it's in main DB, maybe move later if user insists)
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiry < Date.now()) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        const applicant = await Applicant.findOne({ email }).sort({ submittedAt: -1 });
        if (!applicant) return res.status(404).json({ message: "No application found for this email." });

        await HiringAuditLog.create({
            action: "STATUS_CHECK",
            userId: email,
            details: `User checked status: ${applicant.status}`,
            ipAddress: req.ip
        });

        const User = require('../models/User');
        const user = await User.findOne({ email });

        res.json({
            status: applicant.status,
            firstName: applicant.firstName,
            email: applicant.email,
            interviewDetails: applicant.interviewDetails,
            hasAccount: !!user
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ============================================
// ROLES MANAGEMENT
// ============================================

// GET all active roles
router.get('/admin/roles', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const roles = await RolesMaster.find({ isActive: true }).sort({ name: 1 });
        res.json(roles.map(r => r.name));
    } catch (error) {
        console.error('Roles fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch roles' });
    }
});

// POST add new role
router.post('/admin/roles', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { name, category } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        console.log(`[Admin] Adding role: "${name}"`);

        // Escape regex special characters to prevent crashes (e.g. "C++")
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existing = await RolesMaster.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });

        if (existing) {
            console.log(`[Admin] Role "${name}" already exists`);
            return res.status(400).json({ message: 'Role already exists' });
        }

        const newRole = new RolesMaster({
            name: name.trim(),
            category: category || 'Custom'
        });

        await newRole.save();
        res.status(201).json({ message: 'Role added successfully', role: newRole.name });
    } catch (error) {
        console.error('Role add error:', error);
        res.status(500).json({ message: 'Failed to add role' });
    }
});

// Activate Fellowship (User Action)
router.post('/onboarding/activate', authenticateJWT, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const profile = await FellowshipProfile.findOne({ email: userEmail });

        if (!profile) return res.status(404).json({ msg: "Profile not found" });

        // Ensure onboarding is complete (you might want to check strict state)
        if (profile.onboardingState !== 'COMPLETION') {
            return res.status(400).json({ msg: "Onboarding not complete" });
        }

        profile.status = 'ACTIVE';
        await profile.save();

        res.json({ msg: "Fellowship Activated", status: 'ACTIVE' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Activation failed" });
    }
});

module.exports = router;
