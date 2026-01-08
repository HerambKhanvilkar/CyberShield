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
router.post('/apply', upload.single('resumeFile'), [
    check('orgCode').notEmpty(),
    check('email').isEmail(),
    check('firstName').notEmpty(),
    check('lastName').notEmpty(),
    check('role').notEmpty()
    // project removed per request
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation Errors:", errors.array());
        return res.status(400).json({ errors: errors.array(), message: "Validation failed" });
    }

    try {
        console.log("Submission Body:", req.body);
        console.log("Submission File:", req.file);
        const { orgCode, email, firstName, lastName, role, data: dataRaw } = req.body;

        let data = {};
        try {
            data = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : (dataRaw || {});
        } catch (e) { }

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

        // Duplicate Check
        const existingApplicant = await Applicant.findOne({ email });
        if (existingApplicant) {
            return res.status(400).json({ message: "Application already exists for this email." });
        }
        const existingFellow = await FellowshipProfile.findOne({ email });
        if (existingFellow) {
            return res.status(400).json({ message: "User is already an active Fellow." });
        }

        // Create Applicant
        const applicant = new Applicant({
            orgCode,
            organizationId: org._id,
            email,
            firstName,
            lastName,
            role,
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
        const { id, name, code, emailDomainWhitelist, endDate, formVar1, isActive } = req.body;

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
        org.formVar1 = formVar1;
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

        res.json({
            status: applicant.status,
            firstName: applicant.firstName,
            email: applicant.email
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
