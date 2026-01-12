const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Otp = require('../models/Otp');

// Resend OTP endpoint (with cooldown)
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: "Email is required" });
        }

        const existingOtp = await Otp.findOne({ email });
        const now = Date.now();

        if (!existingOtp) {
            return res.status(404).json({ msg: "No OTP request found for this email" });
        }

        // Check cooldown (2 minutes)
        if (existingOtp.lastAttemptAt && (now - existingOtp.lastAttemptAt.getTime() < 2 * 60 * 1000)) {
            const remainingTime = Math.ceil((2 * 60 * 1000 - (now - existingOtp.lastAttemptAt.getTime())) / 1000);
            return res.status(429).json({
                msg: `Please wait ${remainingTime} seconds before resending OTP.`,
                remainingTime
            });
        }

        // Check hourly limit
        if (existingOtp.attemptCount >= 3 && existingOtp.lastAttemptAt && (now - existingOtp.lastAttemptAt.getTime() < 60 * 60 * 1000)) {
            const remainingTime = Math.ceil((60 * 60 * 1000 - (now - existingOtp.lastAttemptAt.getTime())) / 60000);
            return res.status(429).json({
                msg: `Too many attempts. Please try again in ${remainingTime} minutes.`
            });
        }

        const crypto = require('crypto');
        const newOtp = crypto.randomInt(100000, 999999).toString();
        const expiryTime = now + 10 * 60 * 1000;

        await Otp.updateOne(
            { email },
            {
                $set: {
                    otp: newOtp,
                    expiry: expiryTime,
                    expiresAt: new Date(expiryTime),
                    lastAttemptAt: new Date(now)
                },
                $inc: { attemptCount: 1 }
            }
        );

        const { sendRegistrationOTP } = require('../services/emailService');
        try {
            await sendRegistrationOTP(email, newOtp);
            res.status(200).json({
                msg: "New OTP sent",
                expiresIn: 600
            });
        } catch (emailError) {
            console.error("Failed to resend OTP:", emailError);
            res.status(200).json({ msg: "New OTP sent", expiresIn: 600 });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// Change email endpoint (nullifies existing OTP)
router.post('/change-email', async (req, res) => {
    try {
        const { oldEmail, newEmail } = req.body;

        if (!oldEmail || !newEmail) {
            return res.status(400).json({ msg: "Both old and new email required" });
        }

        // Delete old OTP
        await Otp.deleteOne({ email: oldEmail });

        res.status(200).json({
            msg: "Email changed. Please request a new OTP for the new email address."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
