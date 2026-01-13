const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
const {
  sendRegistrationOTP,
  sendPasswordResetOTP
} = require("../services/emailService");
const { generateToken, generateRefreshToken, authenticateJWT, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require("express-validator");
const mongoSanitize = require("mongo-sanitize");

const User = require("../models/User");
const Otp = require("../models/Otp");
const Badge = require("../models/Badge");
const FellowshipProfile = require("../models/FellowshipProfile");

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Centralized validation schemas
const registerValidationRules = [
  body("firstName").trim().notEmpty().withMessage("Name is required").escape(),
  body("lastName").trim().notEmpty().withMessage("Name is required").escape(),
  body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
    .withMessage("Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"),
  body("otp").isNumeric().withMessage("OTP must be numeric"),
];

const loginValidationRules = [
  body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const resetPasswordValidationRules = [
  body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
  body("otp").isNumeric().withMessage("OTP must be numeric"),
  body("newPassword")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
    .withMessage("Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"),
];

// Centralized validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }
  req.body = mongoSanitize(req.body);
  next();
};

// Route for registration with email OTP verification
router.post("/register", registerValidationRules, validateRequest, async (req, res) => {
  try {
    const { email, firstName, lastName, otp, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        msg: "User already exists! Please log in."
      });
    }
    const otpExist = await Otp.findOne({ email });

    if (!otpExist || otpExist.otp !== String(otp) || otpExist.expiry < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      isAdmin: false // Default to non-admin
    });
    await newUser.save();

    /*       [OPTIONAL] await db.collection("otps").deleteOne({ email, otp });
     *
     *         TODO
     *           console.log("REGISTER: sending Welcome mail....");
     *           await sendWelcomeEmail(email, name);
     *
     *         TODO
     *           const refreshToken = generateRefreshToken(insertResult.insertedId);
     */

    // Generate JWT token
    const token = generateToken(newUser);

    res.json({
      msg: "Signup successful!",
      token,
      user: {
        username: newUser.id,
        firstName: newUser.firstName,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        badges: [],
      }
    });
  } catch (error) {
    console.error("Signup msg:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// Route to request OTP for registration
router.post("/register/otp", [body("email").isEmail().withMessage("Invalid email").normalizeEmail()], validateRequest, async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        msg: "Email already registered",
        action: "login",
        loginUrl: "/login"
      });
    }

    // 1.5 Check if an applicant exists (bypass domain check for status tracking)
    const Applicant = require('../models/Applicant');
    const existingApplicant = await Applicant.findOne({ email: email.toLowerCase() });

    // 2. Extract domain and validate against organization whitelist
    const Organization = require('../models/Organization');
    const emailDomain = email.split('@')[1];
    const { orgCode } = req.body;

    let org;
    if (existingApplicant) {
      // Allow existing applicants to receive OTP regardless of current domain whitelist
      // This is crucial for /portal status checks
    } else if (orgCode) {
      // If orgCode is provided (e.g. from apply page), validate strictly against that org
      org = await Organization.findOne({
        code: { $regex: new RegExp(`^${orgCode}$`, 'i') },
        isActive: true
      });

      if (!org) {
        return res.status(404).json({ msg: "Organization not found or inactive." });
      }

      // Check if domain is in this org's whitelist
      // Match both with and without @ for robustness
      const isAllowed = org.emailDomainWhitelist.some(d =>
        d.replace('@', '').toLowerCase() === emailDomain.toLowerCase()
      );

      if (!isAllowed) {
        return res.status(400).json({
          msg: `Email domain @${emailDomain} is not authorized for ${org.name}. Authorized: ${org.emailDomainWhitelist.join(', ')}`
        });
      }
    } else if (!existingApplicant) {
      // Global check if no orgCode provided AND not an existing applicant
      org = await Organization.findOne({
        $or: [
          { emailDomainWhitelist: emailDomain.toLowerCase() },
          { emailDomainWhitelist: `@${emailDomain.toLowerCase()}` }
        ],
        isActive: true
      });

      if (!org) {
        return res.status(400).json({
          msg: `Email domain @${emailDomain} is not authorized. Please contact your organization administrator.`
        });
      }
    }

    // 3. Check existing OTP for rate limiting
    const existingOtp = await Otp.findOne({ email });
    const now = Date.now();

    if (existingOtp) {
      // Rate limiting: Max 10 attempts per hour (Relaxed for testing/UX)
      if (existingOtp.attemptCount >= 10 && existingOtp.lastAttemptAt && (now - existingOtp.lastAttemptAt.getTime() < 60 * 60 * 1000)) {
        const remainingTime = Math.ceil((60 * 60 * 1000 - (now - existingOtp.lastAttemptAt.getTime())) / 60000);
        return res.status(429).json({
          msg: `Too many OTP requests. Please try again in ${remainingTime} minutes.`
        });
      }

      // Cooldown: Minimum 30 seconds between requests
      if (existingOtp.lastAttemptAt && (now - existingOtp.lastAttemptAt.getTime() < 30 * 1000)) {
        const remainingTime = Math.ceil((30 * 1000 - (now - existingOtp.lastAttemptAt.getTime())) / 1000);
        return res.status(429).json({
          msg: `Please wait ${remainingTime} seconds before requesting a new OTP.`
        });
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryTime = now + 10 * 60 * 1000; // 10 minutes

    // Reset attempt count if last attempt was more than 1 hour ago
    let resetCount = false;
    if (existingOtp && existingOtp.lastAttemptAt && (now - existingOtp.lastAttemptAt.getTime() > 60 * 60 * 1000)) {
      resetCount = true;
    }

    await Otp.updateOne(
      { email },
      {
        $set: {
          otp,
          expiry: expiryTime,
          expiresAt: new Date(expiryTime),
          lastAttemptAt: new Date(now),
          ...(resetCount ? { attemptCount: 1 } : {})
        },
        ...(!resetCount ? { $inc: { attemptCount: 1 } } : {})
      },
      { upsert: true }
    );

    // Send OTP email
    try {
      await sendRegistrationOTP(email, otp);
      res.status(200).json({
        msg: "OTP sent to email",
        expiresIn: 600 // seconds
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Still return success to prevent email enumeration attacks
      res.status(200).json({
        msg: "OTP sent to email",
        expiresIn: 600
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});


// Route for login
router.post("/login", loginValidationRules, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;
    // Include password explicitly (schema may set select: false)
    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    }).select('+password');

    if (!user) return res.status(400).json({ msg: " No User Invalid Credentials" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "No password match Invalid Credentials" });

    // Generate JWT token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token on the user document
    try {
      user.refreshToken = refreshToken;
      await user.save();
    } catch (saveErr) {
      console.error('Failed saving refresh token on user:', saveErr);
    }

    // Fetch earned badges
    const userBadges = user.toJSON();
    const badgeIds = (userBadges?.badges || []).map(b => b.badgeId);
    const numericIds = badgeIds.map(id => parseInt(id)).filter(n => !isNaN(n));
    const stringIds = badgeIds.filter(id => isNaN(parseInt(id)));

    const query = { $or: [] };
    if (stringIds.length > 0) query.$or.push({ badgeId: { $in: stringIds } });
    if (numericIds.length > 0) query.$or.push({ id: { $in: numericIds } });

    const allBadges = query.$or.length > 0 ? await Badge.find(query) : [];

    // Map earned badges with dates (match by badgeId string or numeric id)
    const earnedBadges = allBadges.map(badge => ({
      ...badge.toObject(),
      earnedDate: userBadges?.badges.find(b => String(b.badgeId) === String(badge.badgeId) || String(b.badgeId) === String(badge.id))?.earnedDate
    }));

    // Fetch fellowship status for routing
    const fellowProfile = await FellowshipProfile.findOne({ email: user.email });
    let fellowshipStatus = 'APPLICANT';
    if (fellowProfile) {
      if (fellowProfile.status === 'ACTIVE' || fellowProfile.status === 'COMPLETED' || fellowProfile.status === 'FROZEN') {
        fellowshipStatus = 'FELLOW';
      } else if (fellowProfile.status === 'PENDING' || fellowProfile.status === 'REJECTED') {
        fellowshipStatus = 'ONBOARDING';
      }
    }

    res.status(200).json({
      msg: "Login Successful!",
      token, // Send token to client
      user: {
        username: user.id,
        firstName: user.firstName,
        email: user.email,
        isAdmin: user.isAdmin,
        badges: earnedBadges,
        fellowshipStatus: fellowshipStatus,
      },
    });
  } catch (error) {
    console.error("Login msg:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// // Route to get current user
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const user = await User.findOne({
      _id: decoded.id,
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Also fetch fellowship data if exists
    const profile = await FellowshipProfile.findOne({ email: user.email });

    // Convert to object to add virtuals/fields safely
    const userRes = user.toObject();
    if (profile) {
      userRes.onboardingState = profile.onboardingState;
      userRes.globalPid = profile.globalPid;
      userRes.ndaDateTimeUser = profile.nda.dateTimeUser;
      userRes.socials = profile.socials;
      userRes.tenures = profile.tenures; // Missing field
      userRes.status = profile.status;   // Missing field

      // Determine Route Logic
      if (profile.status === 'ACTIVE' || profile.status === 'COMPLETED' || profile.status === 'FROZEN') {
        userRes.fellowshipStatus = 'FELLOW';
      } else if (profile.status === 'PENDING' || profile.status === 'REJECTED') {
        userRes.fellowshipStatus = 'ONBOARDING'; // or APPLICANT depending on nuance
      } else {
        userRes.fellowshipStatus = 'APPLICANT';
      }
    } else {
      userRes.fellowshipStatus = 'APPLICANT';
    }

    res.status(200).json({ user: userRes });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ msg: "Unauthorized: Invalid token" });
  }
});
// 
// // Route to refresh access token
// TODO
//  REFRESH TOKEN
// router.post("/refresh-token", [body("refreshToken").notEmpty().withMessage("Refresh token is required")], validateRequest, async (req, res) => {
//     const { refreshToken } = req.body;
// 
//     try {
//       const usersCollection = createUserModel(db);
// 
//       const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
// 
//       const user = await usersCollection.findOne({
//         email: decoded.userId,
//         refreshToken: refreshToken,
//       });
// 
//       if (!user) {
//         return res.status(403).json({ msg: "Invalid refresh token" });
//       }
// 
//       const newAccessToken = generateAccessToken(user._id);
// 
//       res.json({ accessToken: newAccessToken });
//     } catch (error) {
//       console.error(error);
//       return res.status(403).json({ msg: "Invalid refresh token" });
//     }
// });
// 
// // Route for logout
// TODO
// LOGOUT
// router.post("/logout", authMiddleware, async (req, res) => {
//   try {
//     const usersCollection = createUserModel(db);
// 
//     await usersCollection.updateOne(
//       { _id: req.userId },
//       { $unset: { refreshToken: "" } }
//     );
// 
//     res.status(200).json({ msg: "Logged out successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: "Server error" });
//   }
// });
// 
// Existing routes for forgot password and reset password remain the same...
router.post("/reset-password/otp", async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Email not found" });
    }

    await Otp.updateOne(
      { email },
      { $set: { otp, expiry: Date.now() + 10 * 60 * 1000 } },
      { upsert: true }
    );

    // Send password reset OTP email
    try {
      await sendPasswordResetOTP(email, otp);
      res.status(200).json({ msg: "OTP sent to email" });
    } catch (emailError) {
      console.error("Failed to send password reset OTP email:", emailError);
      // Still return success to prevent email enumeration attacks
      res.status(200).json({ msg: "OTP sent to email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/reset-password", resetPasswordValidationRules, validateRequest, async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || otpRecord.expiry < Date.now())
      return res.status(400).json({ msg: "Invalid or expired OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    res.status(200).json({ msg: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// --- OTP Login Flow for Portal ---

// 1. Request OTP for Login
router.post("/login-otp", [body("email").isEmail().withMessage("Invalid email").normalizeEmail()], validateRequest, async (req, res) => {
  try {
    const { email } = req.body;

    // Check both main User DB and FellowshipProfile (Hiring DB)
    const user = await User.findOne({ email });
    const profile = await FellowshipProfile.findOne({ email });

    if (!user && !profile) {
      return res.status(404).json({ msg: "User not found. Please contact support." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    // Upsert OTP
    await Otp.updateOne(
      { email },
      { $set: { otp, expiry: Date.now() + 10 * 60 * 1000 } },
      { upsert: true }
    );

    // Send OTP
    try {
      const { sendRegistrationOTP } = require('../services/emailService');
      await sendRegistrationOTP(email, otp);
      res.status(200).json({ msg: "OTP sent to your email." });
    } catch (emailError) {
      console.error("Failed to send OTP:", emailError);
      res.status(500).json({ msg: "Failed to send email." });
    }
  } catch (error) {
    console.error("Login OTP msg:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// 2. Verify OTP and Login
router.post("/verify-login-otp", [
  body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
  body("otp").isNumeric().withMessage("OTP must be numeric")
], validateRequest, async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiry < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Try to find in main User DB first, then FellowshipProfile
    let user = await User.findOne({ email });
    const profile = await FellowshipProfile.findOne({ email });

    // If only exists in FellowshipProfile, we might want to create a shadow user or just return profile
    // For flow purposes, we return a token based on whatever we found.
    // Use User ID if available, otherwise FellowshipProfile ID.
    const identity = user || profile;
    if (!identity) {
      return res.status(404).json({ msg: "User record missing." });
    }

    // Clear OTP after successful use
    await Otp.deleteOne({ email });

    // Generate Tokens
    const { generateToken, generateRefreshToken } = require('../middleware/auth');
    const token = generateToken(identity);
    const refreshToken = generateRefreshToken(identity);

    if (user) {
      user.refreshToken = refreshToken;
      await user.save();
    }

    // Return same structure as normal login
    res.status(200).json({
      msg: "Login Successful",
      token,
      user: {
        id: identity._id || identity.id,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        isAdmin: user ? user.isAdmin : false, // Fellowship-only profiles are not admins
        // Portal specific fields
        ndaDateTimeUser: profile ? profile.nda.dateTimeUser : "0",
        pid: profile ? profile.globalPid : "",
        onboardingState: profile ? profile.onboardingState : "COMPLETED"
      }
    });

  } catch (error) {
    console.error("Verify OTP msg:", error);
    res.status(500).json({ msg: "Server error" });
  }
});



// Generic OTP Validation (for forms like Application)
router.post("/validate-otp", [
  body("email").isEmail(),
  body("otp").isNumeric()
], validateRequest, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiry < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }
    res.status(200).json({ msg: "OTP valid" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

