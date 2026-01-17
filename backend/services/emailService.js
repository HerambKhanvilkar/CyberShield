const formData = require('form-data');
const Mailgun = require('mailgun.js');
const logger = require('../logger');
const Badge = require('../models/Badge');
const { getPremiumTemplate } = require('../emailTemplates/premium');

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
const sendEmail = async ({ to, subject, html, from = null, attachments = [] }) => {
  if (!mg) {
    logger.error('Mailgun not initialized. Cannot send email.');
    throw new Error('Email service not configured');
  }

  // Default: use MAILGUN_FROM_noreply, fallback to noreply@<domain>
  const fromEmail = from || process.env.MAILGUN_FROM_noreply || `noreply@${process.env.MAILGUN_DOMAIN}`;

  try {
    const messageData = {
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
      attachment: attachments // Mailgun.js expects 'attachment' field which can be an array of paths or file objects
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
    html: html,
    from: process.env.MAILGUN_FROM
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
    html: html,
    from: process.env.MAILGUN_FROM
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
    html: html,
    from: process.env.MAILGUN_FROM
  });
};

/**
 * Send interview scheduled notification
 * @param {string} email - Recipient email
 * @param {Date} scheduledAt - Interview date and time
 * @param {string} meetLink - Google Meet link
 */
const sendInterviewScheduledEmail = async (email, scheduledAt, meetLink) => {
  const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const html = getPremiumTemplate({
    title: '📅 Interview Scheduled',
    message: 'Your engagement sequence has been initialized. Please prepare for your fellowship evaluation at the designated time.',
    bodyContent: `
      <div style="background: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.2); padding: 25px; border-radius: 12px; text-align: left;">
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #06b6d0; font-family: monospace;">[EVENT_DETAILS]</p>
        <p style="margin: 5px 0; color: #ffffff;"><strong>DATE:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0; color: #ffffff;"><strong>LINK:</strong> <a href="${meetLink}" style="color: #06b6d0; text-decoration: underline;">Open Secure Meeting</a></p>
      </div>
      <div style="margin-top: 25px;">
        <a href="${meetLink}" style="display: inline-block; padding: 14px 28px; background: #06b6d0; color: #000; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Join Briefing Terminal</a>
      </div>
    `,
    footerExtra: `Please ensure your audio/visual systems are optimized 5 minutes prior to synchronization.`
  });

  return sendEmail({
    to: email,
    subject: '📅 Interview Scheduled: DeepCytes Fellowship',
    html: html
  });
};

/**
 * Send application status update
 * @param {string} email - Recipient email
 * @param {string} status - 'ACCEPTED' or 'REJECTED'
 */
const sendApplicationStatusEmail = async (email, status) => {
  const isAccepted = status === 'ACCEPTED';
  const subject = isAccepted ? '🎉 Congratulations! Access Granted to DeepCytes Fellowship' : 'Application Status Update - DeepCytes Fellowship';
  const portalLink = `${process.env.FRONTEND || 'http://localhost:3000'}/portal`;

  const html = getPremiumTemplate({
    title: isAccepted ? '🎉 Application Accepted' : '📢 Status Update',
    message: isAccepted
      ? 'We are thrilled to inform you that your application to the DeepCytes Fellowship has been successfully verified and accepted.'
      : 'Thank you for your interest in the DeepCytes Fellowship. After careful review of our current cohort capacity, we are unable to proceed with your candidacy at this time.',
    bodyContent: `
      <div style="margin: 30px 0;">
        <span style="font-size: 14px; color: ${isAccepted ? '#10b981' : '#ef4444'}; font-family: monospace; border: 1px solid currentColor; padding: 4px 12px; border-radius: 100px;">
          STATUS: ${status}
        </span>
      </div>
      ${isAccepted ? `
        <p style="color: #b0b0b0; margin-bottom: 25px;">Your credentials have been provisioned. You may now proceed to the Fellowship Portal to begin your deployment.</p>
        <a href="${portalLink}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #000; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Initialize Onboarding</a>
      ` : `
        <p style="color: #888; font-size: 14px;">We encourage you to maintain your focus and apply for future cohorts. Your application data will be archived for 12 months.</p>
      `}
    `
  });

  return sendEmail({
    to: email,
    subject: subject,
    html: html
  });
};

/**
 * Send termination/dropped email with optional document attachments
 * @param {string} email - Recipient email
 * @param {string} reason - Reason for termination (optional)
 * @param {Array} attachments - Array of file paths to attach
 */
const sendTerminationEmail = async (email, reason = 'Performance Review', attachments = []) => {
  const html = getPremiumTemplate({
    title: '⚠️ Status Deactivated',
    message: 'Your active tenure with the DeepCytes Fellowship has been terminated effective immediately.',
    bodyContent: `
      <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 25px; border-radius: 12px; text-align: left;">
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #ef4444; font-family: monospace;">[TERMINATION_PROTOCOL_IN_EFFECT]</p>
        <p style="margin: 5px 0; color: #ffffff;"><strong>PROTOCOL:</strong> ${reason}</p>
        <p style="margin: 5px 0; color: #b0b0b0;"><strong>ASSETS:</strong> Your signed documents are attached to this email for your records. Internal resource access has been revoked.</p>
      </div>
      <p style="margin-top: 25px; color: #888; font-size: 13px;">If you believe this action was taken in error, please contact administration immediately.</p>
    `
  });

  return sendEmail({
    to: email,
    subject: '⚠️ Fellowship Status Update - Tenure Terminated',
    html: html,
    attachments
  });
};

/**
 * Send promotion email
 * @param {string} email - Recipient email
 * @param {string} newRole - New Role Title
 */
const sendPromotionEmail = async (email, newRole) => {
  const dashboardLink = `${process.env.FRONTEND || 'http://localhost:3000'}/FellowshipProfile`;

  const html = getPremiumTemplate({
    title: '🚀 Promotion Synchronized',
    message: `Congratulations on your advancement within the DeepCytes Fellowship. Your dedication has been recognized.`,
    bodyContent: `
      <div style="background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.2); padding: 25px; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #a855f7; font-family: monospace;">[RANK_ASCENSION]</p>
        <h2 style="margin: 10px 0; color: #ffffff; font-size: 24px;">${newRole}</h2>
      </div>
      <div style="margin-top: 30px;">
        <a href="${dashboardLink}" style="display: inline-block; padding: 14px 28px; background: #a855f7; color: #fff; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Update Dashboard Credentials</a>
      </div>
    `
  });

  return sendEmail({
    to: email,
    subject: `🚀 Promotion Update: You are now a ${newRole}`,
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
  sendAdminDailyReport,
  sendInterviewScheduledEmail,
  sendApplicationStatusEmail,
  sendTerminationEmail,
  sendPromotionEmail
};
