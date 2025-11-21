const jwt = require('jsonwebtoken');

// Environment variables (add these to .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate JWT token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authentication required" });
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
      return res.status(401).json({ error: 'token_expired', message: 'Token expired' });
    }
    if (error && error.name === 'JsonWebTokenError') {
      console.warn('Invalid JWT:', error.message);
      return res.status(401).json({ error: 'invalid_token', message: 'Invalid token' });
    }

    // Unexpected error: log message but avoid noisy stack traces in production.
    console.warn('JWT verification error:', error && error.message ? error.message : error);
    return res.status(401).json({ error: 'authentication_failed', message: 'Invalid or expired token' });
  }
};

// Admin verification middleware
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
};

module.exports = { generateRefreshToken, generateToken, authenticateJWT, isAdmin };
