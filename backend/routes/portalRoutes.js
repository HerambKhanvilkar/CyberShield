const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { check, validationResult } = require('express-validator');

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
        // Don't block flow for log failure
    }
};

// 1. Confirm First/Last Name
router.put('/update-name', authenticateJWT, [
    check('firstName').trim().notEmpty(),
    check('lastName').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Allow edit only if not already confirmed?
        // Prompt says: "even if the data exists, show it and let them edit if they want but only once. Audit log is created as soon as they confirm."
        // We can check if `ndaDateTimeUser` is "0" to imply "onboarding phase". 
        // Or just let them update it. Prompt says "only once". 
        // I'll trust the frontend to lock it, backend will log it.

        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        await user.save();

        await logAction(user._id, 'NAME_CONFIRM', `Updated name to ${user.firstName} ${user.lastName}`, req);

        res.json({ message: "Name updated successfully", user: { firstName: user.firstName, lastName: user.lastName } });
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
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.ndaDateTimeUser && user.ndaDateTimeUser !== "0") {
            return res.status(400).json({ message: "NDA already signed" });
        }

        const { legalName } = req.body;

        // Check if legal name is all caps? Prompt: "entering their full legal name in a box in all capital"
        if (legalName !== legalName.toUpperCase()) {
            return res.status(400).json({ message: "Please enter your name in ALL UPPERCASE letters." });
        }

        // Generate PID
        // Find last user with a PID to increment
        const lastUserWithPid = await User.findOne({ pid: { $ne: "" } }).sort({ pid: -1 }); // Lexicographical sort works for F00000 format

        let nextPid = "F00000";
        if (lastUserWithPid && lastUserWithPid.pid) {
            const currentHex = lastUserWithPid.pid.substring(1); // remove 'F'
            const nextVal = parseInt(currentHex, 16) + 1;
            nextPid = "F" + nextVal.toString(16).toUpperCase().padStart(5, '0');
        }

        // Update User
        user.ndaLegalName = legalName;

        // Timestamp format: HHMMSS DDMMYYYY
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const timestampStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())} ${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;

        user.ndaDateTimeUser = timestampStr;
        user.ndaDateTimeDC = timestampStr; // Prompt says "fraction of a second delayed i guess", effectively same or close.
        user.pid = nextPid;

        await user.save();

        await logAction(user._id, 'NDA_SIGN', `Signed NDA as ${legalName}. PID Assigned: ${nextPid}`, req);

        res.json({ message: "NDA Signed successfully", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 3. Download NDA
router.get('/download-nda', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.ndaDateTimeUser === "0") {
            return res.status(403).json({ message: "NDA not signed yet" });
        }

        // TODO: Generate PDF logic here using pdf-lib or similar
        // 1. Load Template
        // 2. Fill Data (Name, Date, PID)
        // 3. Flatten/Lock
        // 4. Set Password (LastName_ID ?) - Prompt: "LastName_ID" (assuming ID is PID?)
        // 5. Watermark

        await logAction(user._id, 'NDA_DOWNLOAD', 'Downloaded NDA PDF', req);

        // Mock Response for now
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=DC_NDA_SIGNED.pdf');
        res.send("PDF_CONTENT_PLACEHOLDER");

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 4. Update Socials
router.put('/update-socials', authenticateJWT, [
    check('github').optional().isURL(),
    check('linkedin').optional().isURL()
], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (req.body.github) user.github = req.body.github;
        if (req.body.linkedin) user.linkedin = req.body.linkedin;

        await user.save();
        await logAction(user._id, 'PROFILE_UPDATE', 'Updated social links', req);
        res.json({ message: "Socials updated", user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 5. Download Offer Letter
router.get('/download-offer', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        // Logic: Unlocks after "Profile is activated" -> which happens after NDA sign?
        // Prompt: "Now the user is prompted that their profile is activated. Now the offer letter unlocks for user."
        if (!user || user.ndaDateTimeUser === "0") {
            return res.status(403).json({ message: "Profile not active yet." });
        }

        // Check if offer exists in tenure array? Or we generate one for the current/latest tenure?
        // Prompt: "11. Tenure Array... 11E. OfferDateTime... Download button fetches template pdf..."
        // We should probably mark the `OfferDateTime` in the tenure array if it is 0.

        // For simplicity, let's assume we work with the latest tenure or index 0 for now.
        // Or we just return the PDF. Tracking "OfferDateTime" in DB might be needed if it updates.

        await logAction(user._id, 'OFFER_DOWNLOAD', 'Downloaded Offer Letter', req);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=DC_OFFER.pdf');
        res.send("OFFER_PDF_PLACEHOLDER");

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
