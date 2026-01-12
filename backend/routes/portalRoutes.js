const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const FellowshipProfile = require('../models/FellowshipProfile');
const User = require('../models/User'); // ADDED
const AuditLog = require('../models/AuditLog');
const LifecycleManager = require('../services/LifecycleManager');
const DocumentService = require('../services/DocumentService');
const { check, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Helper to Log Actions
const logAction = async (userId, action, details = '', req) => {
    try {
        await AuditLog.create({
            userId,
            action,
            details,
            ipAddress: req.ip
        });
    } catch (err) {
        console.error("Failed to create audit log:", err);
    }
};

// 1. Complete Profile (Name + Socials)
router.put('/complete-profile', authenticateJWT, [
    check('firstName').trim().notEmpty().withMessage("First name is required"),
    check('lastName').trim().notEmpty().withMessage("Last name is required"),
    check('linkedin').isURL().withMessage("Valid LinkedIn URL is required")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const profile = await FellowshipProfile.findOne({ email: req.user.email });
        if (!profile) return res.status(404).json({ message: "Fellowship profile not found" });

        if (profile.nda.dateTimeUser !== "0") {
            return res.status(400).json({ message: "Data is immutable post-NDA signature." });
        }

        const sanitizeUrl = (url) => {
            if (!url) return "";
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            return `https://${url}`;
        };

        profile.firstName = req.body.firstName;
        profile.lastName = req.body.lastName;
        profile.socials.linkedin = sanitizeUrl(req.body.linkedin);
        profile.socials.github = req.body.github ? sanitizeUrl(req.body.github) : profile.socials.github;

        // Sync with Main User DB
        await User.updateOne({ email: req.user.email }, {
            firstName: req.body.firstName,
            lastName: req.body.lastName
        });

        // Transition to NDA state
        profile.onboardingState = 'NDA';
        await profile.save();

        await logAction(profile._id, 'PROFILE_COMPLETE', `Updated profile and moved to NDA`, req);

        res.json({ message: "Profile updated. Please proceed to NDA.", profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 2. Sign NDA
router.post('/sign-nda', authenticateJWT, [
    check('legalName').trim().notEmpty().withMessage("Legal Name is required"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { legalName } = req.body;
        if (legalName !== legalName.toUpperCase()) {
            return res.status(400).json({ message: "Please enter your name in ALL UPPERCASE letters." });
        }

        const profile = await FellowshipProfile.findOne({ email: req.user.email });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        const updatedProfile = await LifecycleManager.signNDA(profile._id, legalName);
        await logAction(updatedProfile._id, 'NDA_SIGN', `Signed NDA as ${legalName}. PID: ${updatedProfile.globalPid}`, req);

        res.json({ message: "NDA Signed successfully", profile: updatedProfile });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});

// 3. Download NDA
router.get('/download-nda', authenticateJWT, async (req, res) => {
    try {
        const profile = await FellowshipProfile.findOne({ email: req.user.email });
        if (!profile || profile.nda.dateTimeUser === "0") {
            return res.status(403).json({ message: "NDA not signed yet" });
        }

        const applicantData = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            globalPid: profile.globalPid
        };

        const signatureInfo = {
            type: 'TYPED',
            data: profile.nda.signedName
        };

        const { buffer, hash } = await DocumentService.generateNDA(applicantData, signatureInfo);

        profile.nda.pdfHash = hash;
        await profile.save();

        await logAction(profile._id, 'NDA_DOWNLOAD', 'Downloaded Premium NDA PDF', req);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=DC_NDA_SIGNED.pdf');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Document generation failed" });
    }
});

// 4. Download Offer Letter
router.get('/download-offer', authenticateJWT, async (req, res) => {
    try {
        const profile = await FellowshipProfile.findOne({ email: req.user.email });
        if (!profile || profile.onboardingState === 'PROFILE' || profile.onboardingState === 'NDA') {
            return res.status(403).json({ message: "Offer letter not available yet. Please sign NDA." });
        }

        const tenureIndex = parseInt(req.query.tenureIndex) || 0;
        const selectedTenure = profile.tenures[tenureIndex] || profile.tenures[profile.tenures.length - 1];

        const fellowData = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            globalPid: profile.globalPid
        };

        const tenureData = {
            role: selectedTenure.role,
            startDate: selectedTenure.startDate,
            endDate: selectedTenure.endDate || 'Ongoing'
        };

        const { buffer } = await DocumentService.generateOfferLetter(fellowData, tenureData);

        await logAction(profile._id, 'OFFER_DOWNLOAD', 'Downloaded Premium Offer Letter', req);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=DC_OFFER_LETTER.pdf');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Offer generation failed" });
    }
});


// 5. Submit Feedback
// 5. Submit Feedback
router.post('/submit-feedback', authenticateJWT, async (req, res) => {
    try {
        const { feedback } = req.body;

        if (!feedback || typeof feedback !== 'object') {
            return res.status(400).json({ message: "Invalid feedback data" });
        }

        const profile = await FellowshipProfile.findOne({ email: req.user.email });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // Update state to COMPLETION
        profile.onboardingState = 'COMPLETION';

        // Save feedback to the latest tenure
        if (profile.tenures.length > 0) {
            const lastTenure = profile.tenures[profile.tenures.length - 1];
            lastTenure.feedback = feedback;
            lastTenure.status = 'COMPLETED';
        }

        await profile.save();
        await logAction(profile._id, 'FEEDBACK_SUBMIT', 'Submitted tenure feedback and moved to completion', req);

        res.json({ message: "Feedback submitted successfully. You are now graduated!", profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Submission failed" });
    }
});

// 6. Advance Onboarding State
router.post('/advance-state', authenticateJWT, [
    check('targetState').notEmpty().withMessage("Target state is required")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { targetState } = req.body;
        const profile = await FellowshipProfile.findOne({ email: req.user.email });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // Update state logic
        const updatedProfile = await LifecycleManager.transitionState(profile._id, targetState);
        await logAction(updatedProfile._id, 'STATE_ADVANCE', `Advanced to ${targetState}`, req);

        res.json({ message: `State advanced to ${targetState}`, profile: updatedProfile });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
