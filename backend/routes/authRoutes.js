const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
// TODO: Setup OTP mail
// const nodemailer = require("nodemailer");
// const { sendEmail, sendWelcomeEmail } = require("../auth/mail");
// const authMiddleware = require("../../middleware/auth");
const { generateToken, generateRefreshToken, authenticateJWT, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require("express-validator");
const mongoSanitize = require("mongo-sanitize");

const User = require("../models/User");
const Otp = require("../models/Otp");
const Badge = require("../models/Badge");

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
    return res.status(400).json({ error: errors.array() });
  }
  req.body = mongoSanitize(req.body);
  next();
};

// Route for registration with email OTP verification
router.post("/register", validateRequest, async (req, res) => {
  try {
    const { email, firstName, lastName, otp, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ 
        message: "User already exists! Please log in." 
      });
    }
    const otpExist = await Otp.findOne({ email});
    if (!otpExist || otpExist.expiry < Date.now()){
      return res.status(400).json({ error: "Invalid or expired OTP" });
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
      message: "Signup successful!", 
      token, // Send token to client
      user: { 
          username: newUser.id,
          firstName: newUser.firstName,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
          badges: [],
      } 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to request OTP for registration
router.post("/register/otp", [body("email").isEmail().withMessage("Invalid email").normalizeEmail()], validateRequest, async (req, res) => {
    try {
    const { email } = req.body;
    const otp = crypto.randomInt(100000, 999999).toString();

      await Otp.updateOne(
        { email },
        { $set: { otp, expiry: Date.now() + 10 * 60 * 1000 } },
        { upsert: true }
      );

      // TODO
      // await sendEmail(email, "Your OTP for Registration", `Your OTP is ${otp}`);
      res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
});


// Route for login
router.post("/login", loginValidationRules, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    }).select('password');

    if (!user) return res.status(400).json({ message: " No User Invalid Credentials" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "No password match Invalid Credentials" });

    // Generate JWT token
    const token =  generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // TODO: CONVERT TO MONGOOOSE 
      await user.updateOne(
        { $set: { refreshToken } }
      );

    await user.save();

    // Fetch earned badges
    const userBadges = user.toJSON();
    console.log(userBadges);
    const allBadges = userBadges
      ? await Badge.find({ id: { $in: userBadges.badges.map(b => b.badgeId) } })
      : [];

    // Map earned badges with dates
    const earnedBadges = allBadges.map(badge => ({
      ...badge.toObject(),
      earnedDate: userBadges?.badges.find(b => b.badgeId === badge.id)?.earnedDate
    }));

    res.status(200).json({
        message: "Login Successful!",
        token, // Send token to client
        user: {
          username: user.id,
          firstName: user.firstName,
          email: user.email,
          isAdmin: user.isAdmin,
          badges: earnedBadges,
        },
      });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// // Route to get current user
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const user = await User.findOne({
      _id: decoded.id,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
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
//         return res.status(403).json({ error: "Invalid refresh token" });
//       }
// 
//       const newAccessToken = generateAccessToken(user._id);
// 
//       res.json({ accessToken: newAccessToken });
//     } catch (error) {
//       console.error(error);
//       return res.status(403).json({ error: "Invalid refresh token" });
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
//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
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
      return res.status(400).json({ error: "Email not found" });
    }

    await Otp.updateOne(
      { email },
      { $set: { otp, expiry: Date.now() + 10 * 60 * 1000 } },
      { upsert: true }
    );

    // TODO
    // RESET-PASSWORD
    // await sendEmail(email, "OTP for Password Reset", `Your OTP is ${otp}`);
    // console.log(email, "OTP for Password Reset", `Your OTP is ${otp}`);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
      const otpRecord = await Otp.findOne({ email });
      if (!otpRecord || otpRecord.expiry < Date.now())
        return res.status(400).json({ error: "Invalid or expired OTP" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ email }, { $set: { password: hashedPassword } });

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
