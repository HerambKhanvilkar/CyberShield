const jwt = require('jsonwebtoken');

// Environment variables (add these to .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate JWT token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: "Authentication required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Handle common JWT errors gracefully and return a clear status/code.
    // - TokenExpiredError: token is valid but expired -> 401 Unauthorized
    // - JsonWebTokenError: token is malformed/invalid -> 401 Unauthorized
    // Otherwise return a generic 401 without printing full stack traces.
    if (error && error.name === 'TokenExpiredError') {
      // Don't print full stack for expired tokens; log minimal info at debug level.
      console.warn('JWT expired:', error.message);
      return res.status(401).json({ error: 'token_expired', msg: 'Token expired' });
    }
    if (error && error.name === 'JsonWebTokenError') {
      console.warn('Invalid JWT:', error.message);
      return res.status(401).json({ error: 'invalid_token', msg: 'Invalid token' });
    }

    // Unexpected msg: log message but avoid noisy stack traces in production.
    console.warn('JWT verification msg:', error && error.message ? error.message : error);
    return res.status(401).json({ error: 'authentication_failed', msg: 'Invalid or expired token' });
  }
};

const FellowshipProfile = require('../models/FellowshipProfile');

// Admin verification middleware
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ msg: "Admin privileges required" });
  }
  next();
};

// Check if user is a Fellow (Active/Completed/etc, NOT Pending)
const isFellow = async (req, res, next) => {
  try {
    const profile = await FellowshipProfile.findOne({ email: req.user.email });
    // If no profile, or status is PENDING/REJECTED, they are NOT a fellow yet
    if (!profile || profile.status === 'PENDING' || profile.status === 'REJECTED') {
      return res.status(403).json({ msg: "Fellow access required. Please complete onboarding first." });
    }
    req.fellow = profile;
    next();
  } catch (err) {
    console.error("isFellow check error:", err);
    res.status(500).json({ msg: "Server error checking fellow status" });
  }
};

// Check if user is an Applicant (or Pending Fellow) - should NOT access Fellowship Dashboard
const isApplicant = async (req, res, next) => {
  try {
    const profile = await FellowshipProfile.findOne({ email: req.user.email });
    // If they ARE a fellow (Active+), they should go to dashboard, not portal
    if (profile && (profile.status === 'ACTIVE' || profile.status === 'COMPLETED' || profile.status === 'FROZEN')) {
      return res.status(403).json({
        msg: "You are a Member. Please use /MemberProfile",
        redirect: "/MemberProfile"
      });
    }
    next();
  } catch (err) {
    console.error("isApplicant check error:", err);
    res.status(500).json({ msg: "Server error checking applicant status" });
  }
};

module.exports = { generateRefreshToken, generateToken, authenticateJWT, isAdmin, isFellow, isApplicant };
