const formData = require('form-data');
const Mailgun = require('mailgun.js');
const logger = require('../logger');
const Badge = require('../models/Badge');

// Initialize Mailgun
const mailgun = new Mailgun(formData);

let mg = null;

// Initialize Mailgun client
const initializeMailgun = () => {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    logger.warn('Mailgun credentials not found. Email functionality will be disabled.');
    return null;
  }

  try {
    mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net' // EU: https://api.eu.mailgun.net
    });
    logger.info('Mailgun initialized successfully');
    return mg;
  } catch (error) {
    logger.error('Failed to initialize Mailgun:', error);
    return null;
  }
};

// Initialize on module load
mg = initializeMailgun();

/**
 * Send email using Mailgun
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional, uses default if not provided)
 * @returns {Promise<Object>} - Mailgun response
 */
const sendEmail = async ({ to, subject, html, from = null }) => {
  if (!mg) {
    logger.error('Mailgun not initialized. Cannot send email.');
    throw new Error('Email service not configured');
  }

  // Prefer MAILGUN_FROM (new) then MAILGUN_FROM_EMAIL (legacy), then default to noreply@<domain>
  const fromEmail = from || process.env.MAILGUN_FROM || process.env.MAILGUN_FROM_EMAIL || `noreply@${process.env.MAILGUN_DOMAIN}`;

  try {
    const messageData = {
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html
    };

    logger.info(`Sending email to ${to} with subject: ${subject}`);
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    
    logger.info(`Email sent successfully to ${to}. Message ID: ${result.id}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Send OTP email for registration
 * @param {string} email - Recipient email
 * @param {string} otpCode - OTP code
 */
const sendRegistrationOTP = async (email, otpCode) => {
  const { getOTPEmail } = require('../emailTemplates/otp');
  const html = getOTPEmail(otpCode);
  
  return sendEmail({
    to: email,
    subject: '🔐 Email Verification - DeepCytes',
    html: html
  });
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otpCode - OTP code
 */
const sendPasswordResetOTP = async (email, otpCode) => {
  const { getResetPasswordEmail } = require('../emailTemplates/resetpass');
  const html = getResetPasswordEmail(otpCode);
  
  return sendEmail({
    to: email,
    subject: '🔑 Password Reset - DeepCytes',
    html: html
  });
};

/**
 * Send welcome email with credentials to new user
 * @param {string} email - Recipient email
 * @param {string} password - Temporary password
 * @param {string} loginUrl - Login URL
 */
const sendBulkUserWelcomeEmail = async (email, password, loginUrl = null) => {
  const { getBulkUserEmail } = require('../emailTemplates/bulkuser');
  const defaultLoginUrl = loginUrl || process.env.FRONTEND || 'http://localhost:3000/login';
  const html = getBulkUserEmail(email, password, defaultLoginUrl);
  
  return sendEmail({
    to: email,
    subject: '👤 Welcome to DeepCytes - Your Account is Ready!',
    html: html
  });
};

/**
 * Send badge received notification
 * @param {string} email - Recipient email
 * @param {string} badgeName - Name of the badge
 * @param {string} badgeDescription - Badge description
 * @param {string} profileLink - Link to user's profile
 * @param {string|null} certificateId - Optional certificate ID to display
 * @param {string|null} badgeImageUrl - Optional absolute URL to badge image
 */
const sendBadgeReceivedEmail = async (email, badgeName, badgeDescription, profileLink = null, certificateId = null, badgeImageUrl = null) => {
  const { getBadgeReceivedEmail } = require('../emailTemplates/badgerecieve');
  const frontendBase = process.env.FRONTEND || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '3001'}`;
  const defaultProfileLink = profileLink || `${frontendBase}/profile`;

  // If caller didn't pass an explicit badgeImageUrl, attempt to derive one from certificateId
  let finalBadgeImageUrl = badgeImageUrl;
  if (!finalBadgeImageUrl && certificateId) {
    try {
      const digits = String(certificateId).replace(/\D/g, '');
      let badgeIdCandidate = null;

      // Try interpreting the numeric part by stripping a 4-digit sequence (common generation uses 4-digit seq)
      if (digits.length > 4) {
        const tryId = parseInt(digits.slice(0, -4), 10);
        if (!isNaN(tryId)) {
          const bd = await Badge.findOne({ id: tryId }).select('id');
          if (bd) badgeIdCandidate = bd.id;
        }
      }

      // Fallback: try stripping a 3-digit sequence (some certificates use 3-digit seq)
      if (!badgeIdCandidate && digits.length > 3) {
        const tryId2 = parseInt(digits.slice(0, -3), 10);
        if (!isNaN(tryId2)) {
          const bd2 = await Badge.findOne({ id: tryId2 }).select('id');
          if (bd2) badgeIdCandidate = bd2.id;
        }
      }

      // Final fallback: try to find a badge with badgeId equal to the full digits string or containing it
      if (!badgeIdCandidate) {
        const bd3 = await Badge.findOne({ badgeId: digits }).select('id') || await Badge.findOne({ badgeId: { $regex: digits } }).select('id');
        if (bd3) badgeIdCandidate = bd3.id;
      }

      if (badgeIdCandidate) {
        finalBadgeImageUrl = `${frontendBase}/api/badge/images/${badgeIdCandidate}`;
      }
    } catch (e) {
      logger.warn('Unable to derive badge image URL from certificateId:', certificateId, e.message || e);
    }
  }

  // If still not available, use a placeholder image path under frontend
  if (!finalBadgeImageUrl) {
    finalBadgeImageUrl = `${frontendBase}/images/badge-placeholder.png`;
  }

  const html = getBadgeReceivedEmail(badgeName, badgeDescription, defaultProfileLink, certificateId, finalBadgeImageUrl);

  return sendEmail({
    to: email,
    subject: `🎉 Congratulations! You've earned the ${badgeName} badge`,
    html: html
  });
};

/**
 * Send profile update/badge revoked notification
 * @param {string} email - Recipient email
 * @param {string} reasonType - Type of update ('badge_stripped' or 'profile_update')
 * @param {string} badgeName - Name of the badge (if applicable)
 * @param {string} additionalInfo - Additional information
 * @param {string} profileLink - Link to user's profile
 */
const sendProfileUpdateEmail = async (email, reasonType, badgeName = '', additionalInfo = '', profileLink = null) => {
  const { getRevokeUpdateEmail } = require('../emailTemplates/revokeUpdate');
  const defaultProfileLink = profileLink || `${process.env.FRONTEND || 'http://localhost:3000'}/profile`;
  const html = getRevokeUpdateEmail(reasonType, badgeName, additionalInfo, defaultProfileLink);
  
  return sendEmail({
    to: email,
    subject: 'Profile Update Notification - DeepCytes',
    html: html
  });
};

/**
 * Send admin daily report
 * @param {string} email - Admin email
 * @param {string} adminName - Admin name
 * @param {string} date - Report date
 * @param {Array} logs - Array of log objects with {time, action, target, status}
 */
const sendAdminDailyReport = async (email, adminName, date, logs) => {
  const { getAdminDailyEmail } = require('../emailTemplates/admindaily');
  const html = getAdminDailyEmail(adminName, date, logs);
  
  return sendEmail({
    to: email,
    subject: `🛡️ Admin Daily Report - ${date}`,
    html: html
  });
};

module.exports = {
  sendEmail,
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendBulkUserWelcomeEmail,
  sendBadgeReceivedEmail,
  sendProfileUpdateEmail,
  sendAdminDailyReport
};
