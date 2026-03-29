
const logger = require('../logger');
const Badge = require('../models/Badge');
const { getPremiumTemplate } = require('../emailTemplates/premium');
const { DateTime } = require('luxon');
const { enqueueEmailTask } = require('../servicebus/emailQueue');

let azureClient = null;

const isQueueEnabled = () => {
  return String(process.env.EMAIL_QUEUE_ENABLED || '').toLowerCase() === 'true';
};

const enqueueEmail = async (type, payload) => {
  return enqueueEmailTask({
    type,
    payload,
    createdAt: new Date().toISOString()
  });
};

// Initialize Azure Communication Email client
const initializeAzure = () => {
  const connectionString = process.env.AZURE_EMAIL_CONNECTION_STRING;
  if (!connectionString) {
    logger.warn('Azure Email connection string not provided. Azure email integration disabled.');
    return null;
  }

  try {
    const { EmailClient } = require('@azure/communication-email');
    azureClient = new EmailClient(connectionString);
    logger.info('Azure Email client initialized successfully');
    return azureClient;
  } catch (error) {
    logger.error('Failed to initialize Azure Email client:', error);
    return null;
  }
};

// Initialize provider on module load
azureClient = initializeAzure();


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
  const fromEmail = from ||
    process.env.AZURE_EMAIL_SENDER ||
    'DoNotReply@deepcytes.io';

  if (!azureClient) {
    logger.error('Azure email client not initialized. Cannot send email.');
    throw new Error('Email service not configured');
  }

  const emailMessage = {
    senderAddress: fromEmail,
    content: {
      subject,
      html
    },
    recipients: {
      to: [{ address: to }]
    }
  };

  if (attachments && attachments.length) {
    emailMessage.content.attachments = attachments.map(att => {
      const encoded = att.data
        ? att.data.toString('base64')
        : '';
      return {
        name: att.filename,
        contentType: att.contentType || 'application/octet-stream',
        content: encoded
      };
    });
  }

  try {
    logger.info(`Sending email via Azure to ${to} with subject: ${subject}`);
    const poller = await azureClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
    logger.info(`Azure email send result for ${to}: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    logger.error(`Azure failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Send OTP email for registration
 * @param {string} email - Recipient email
 * @param {string} otpCode - OTP code
 */
const sendRegistrationOTP = async (email, otpCode, options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('REGISTRATION_OTP', { email, otpCode });
  }
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
const sendPasswordResetOTP = async (email, otpCode, options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('PASSWORD_RESET_OTP', { email, otpCode });
  }
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
const sendBulkUserWelcomeEmail = async (email, password, loginUrl = null, options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('BULK_USER_WELCOME', { email, password, loginUrl });
  }
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
const sendBadgeReceivedEmail = async (
  email,
  badgeName,
  badgeDescription,
  profileLink = null,
  certificateId = null,
  badgeImageUrl = null,
  options = {}
) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('BADGE_RECEIVED', {
      email,
      badgeName,
      badgeDescription,
      profileLink,
      certificateId,
      badgeImageUrl
    });
  }
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
const sendProfileUpdateEmail = async (
  email,
  reasonType,
  badgeName = '',
  additionalInfo = '',
  profileLink = null,
  options = {}
) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('PROFILE_UPDATE', {
      email,
      reasonType,
      badgeName,
      additionalInfo,
      profileLink
    });
  }
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


/**
 * Send interview scheduled notification
 * @param {string} email - Recipient email
 * @param {Date} scheduledAt - Interview date and time
 * @param {string} meetLink - Google Meet link
 */
const sendInterviewScheduledEmail = async (email, scheduledAt, meetLink, options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('INTERVIEW_SCHEDULED', { email, scheduledAt, meetLink });
  }

  // Always interpret scheduledAt as IST (Asia/Kolkata), regardless of offset or server timezone
  // scheduledAt is expected to be a string like '2026-02-10T10:00'
  let dtIST = DateTime.fromFormat(scheduledAt, "yyyy-MM-dd'T'HH:mm", { zone: 'Asia/Kolkata' });
  if (!dtIST.isValid) {
    // fallback: try parsing as ISO and force to IST
    dtIST = DateTime.fromISO(scheduledAt, { zone: 'Asia/Kolkata' });
  }

  // Format for email (e.g., Tuesday, February 10, 2026, 10:00 AM IST)
  const istDate = dtIST.toFormat("cccc, LLLL d, yyyy, h:mm a 'IST'");

  // For .ics: DTSTART/DTEND in local IST (Asia/Kolkata)
  function pad(n) { return n < 10 ? '0' + n : n; }
  const dt = dtIST;
  const dtEnd = dt.plus({ hours: 1 });
  function icsLocal(dt) {
    return dt.toFormat('yyyyMMdd\'T\'HHmmss');
  }
  const startIST = icsLocal(dt);
  const endIST = icsLocal(dtEnd);

  // VTIMEZONE for Asia/Kolkata
  const vtimezone = [
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'X-LIC-LOCATION:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE'
  ].join('\r\n');

  // Generate .ics calendar invite with IST
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DeepCytes//Interview//EN',
    vtimezone,
    'BEGIN:VEVENT',
    `UID:${Date.now()}@deepcytes.com`,
    `DTSTAMP:${startIST}`,
    `DTSTART;TZID=Asia/Kolkata:${startIST}`,
    `DTEND;TZID=Asia/Kolkata:${endIST}`,
    'SUMMARY:DeepCytes Fellowship Interview',
    'DESCRIPTION:Your interview for the DeepCytes Fellowship. Please join using the provided meeting link.',
    `LOCATION:${meetLink}`,
    `URL:${meetLink}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Structured event block for Gmail auto-detection
  const html = getPremiumTemplate({
    title: 'Interview Invitation',
    message: 'We are pleased to inform you that your interview for the DeepCytes Fellowship has been scheduled. Kindly review the details below and ensure your timely participation.',
    bodyContent: `
      <div style="background: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.2); padding: 25px; border-radius: 12px; text-align: left;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #06b6d0; font-family: monospace;">Interview Event</h3>
        <table style="width:100%; font-size:15px; color:#fff; margin-bottom:10px;">
          <tr><td><strong>Subject:</strong></td><td>DeepCytes Fellowship Interview</td></tr>
          <tr><td><strong>Date & Time:</strong></td><td>${istDate}</td></tr>
          <tr><td><strong>Link:</strong></td><td><a href="${meetLink}" style="color: #06b6d0; text-decoration: underline;">${meetLink}</a></td></tr>
        </table>
        <p style="margin: 5px 0; color: #b0b0b0;">You may add this event to your calendar using the attached file or by clicking the meeting link above.</p>
      </div>
      <div style="margin-top: 25px;">
        <a href="${meetLink}" style="display: inline-block; padding: 14px 28px; background: #06b6d0; color: #000; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Join Interview</a>
      </div>
    `,
    footerExtra: `Please ensure your audio and video equipment are functioning properly at least 5 minutes prior to your scheduled interview. For assistance, please contact our support team.`
  });

  // Attach .ics file for Google Calendar
  const attachments = [
    {
      filename: 'DeepCytes-Interview.ics',
      data: Buffer.from(icsContent, 'utf-8'),
      contentType: 'text/calendar; charset=utf-8'
    }
  ];

  return sendEmail({
    to: email,
    subject: 'Interview Scheduled: DeepCytes Fellowship',
    html: html,
    attachments
  });
};

/**
 * Send application status update
 * @param {string} email - Recipient email
 * @param {string} status - 'ACCEPTED' or 'REJECTED'
 */
const sendApplicationStatusEmail = async (email, status, options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('APPLICATION_STATUS', { email, status });
  }
  const isAccepted = status === 'ACCEPTED';
  const subject = isAccepted ? 'DeepCytes Fellowship Application Approved' : 'DeepCytes Fellowship Application Status';
  const portalLink = `${process.env.FRONTEND || 'http://localhost:3000'}/portal`;

  const html = getPremiumTemplate({
    title: isAccepted ? 'Application Approved' : 'Application Status Update',
    message: isAccepted
      ? 'We are pleased to inform you that your application for the DeepCytes Fellowship has been approved. Please follow the instructions below to proceed.'
      : 'Thank you for your interest in the DeepCytes Fellowship. After careful consideration, we regret to inform you that we are unable to offer you a position at this time.',
    bodyContent: `
      <div style="margin: 30px 0;">
        <span style="font-size: 14px; color: ${isAccepted ? '#10b981' : '#ef4444'}; font-family: monospace; border: 1px solid currentColor; padding: 4px 12px; border-radius: 100px;">
          STATUS: ${status}
        </span>
      </div>
      ${isAccepted ? `
        <p style="color: #b0b0b0; margin-bottom: 25px;">Your credentials have been provisioned. You may now access the Fellowship Portal to begin onboarding.</p>
        <a href="${portalLink}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #000; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Access Fellowship Portal</a>
      ` : `
        <p style="color: #888; font-size: 14px;">We encourage you to apply for future cohorts. Your application data will be retained for 12 months for future consideration.</p>
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
const sendTerminationEmail = async (email, reason = 'Performance Review', attachments = [], options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    if (!attachments || attachments.length === 0) {
      return enqueueEmail('TERMINATION', { email, reason });
    }
    logger.warn('Termination email has attachments; sending directly to avoid missing files.');
  }
  const html = getPremiumTemplate({
    title: 'Fellowship Status Update',
    message: 'We regret to inform you that your tenure with the DeepCytes Fellowship has been terminated, effective immediately. Please review the details below.',
    bodyContent: `
      <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 25px; border-radius: 12px; text-align: left;">
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #ef4444; font-family: monospace;">Termination Details</p>
        <p style="margin: 5px 0; color: #ffffff;"><strong>Reason:</strong> ${reason}</p>
        <p style="margin: 5px 0; color: #b0b0b0;"><strong>Documents:</strong> Your signed documents are attached for your records. All internal resource access has been revoked.</p>
      </div>
      <p style="margin-top: 25px; color: #888; font-size: 13px;">If you believe this action was taken in error, please contact our administration team immediately.</p>
    `
  });

  return sendEmail({
    to: email,
    subject: 'Fellowship Termination Notice',
    html: html,
    attachments
  });
};

/**
 * Send promotion email
 * @param {string} email - Recipient email
 * @param {string} newRole - New Role Title
 */
const sendPromotionEmail = async (email, newRole, options = {}) => {
  if (!options.bypassQueue && isQueueEnabled()) {
    return enqueueEmail('PROMOTION', { email, newRole });
  }
  const dashboardLink = `${process.env.FRONTEND || 'http://localhost:3000'}/FellowshipProfile`;

  const html = getPremiumTemplate({
    title: 'Promotion Notification',
    message: `We are pleased to announce your promotion within the DeepCytes Fellowship. Your commitment and achievements have been duly recognized.`,
    bodyContent: `
      <div style="background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.2); padding: 25px; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #a855f7; font-family: monospace;">Promotion Details</p>
        <h2 style="margin: 10px 0; color: #ffffff; font-size: 24px;">${newRole}</h2>
      </div>
      <div style="margin-top: 30px;">
        <a href="${dashboardLink}" style="display: inline-block; padding: 14px 28px; background: #a855f7; color: #fff; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Access Dashboard</a>
      </div>
    `
  });

  return sendEmail({
    to: email,
    subject: `Promotion Update: ${newRole}`,
    html: html
  });
};

const processEmailQueueMessage = async (task) => {
  if (!task || !task.type) {
    throw new Error('Invalid email task payload');
  }

  const payload = task.payload || {};

  switch (task.type) {
    case 'REGISTRATION_OTP':
      return sendRegistrationOTP(payload.email, payload.otpCode, { bypassQueue: true });
    case 'PASSWORD_RESET_OTP':
      return sendPasswordResetOTP(payload.email, payload.otpCode, { bypassQueue: true });
    case 'BULK_USER_WELCOME':
      return sendBulkUserWelcomeEmail(payload.email, payload.password, payload.loginUrl || null, { bypassQueue: true });
    case 'BADGE_RECEIVED':
      return sendBadgeReceivedEmail(
        payload.email,
        payload.badgeName,
        payload.badgeDescription,
        payload.profileLink || null,
        payload.certificateId || null,
        payload.badgeImageUrl || null,
        { bypassQueue: true }
      );
    case 'PROFILE_UPDATE':
      return sendProfileUpdateEmail(
        payload.email,
        payload.reasonType,
        payload.badgeName || '',
        payload.additionalInfo || '',
        payload.profileLink || null,
        { bypassQueue: true }
      );
    case 'INTERVIEW_SCHEDULED':
      return sendInterviewScheduledEmail(payload.email, payload.scheduledAt, payload.meetLink, { bypassQueue: true });
    case 'APPLICATION_STATUS':
      return sendApplicationStatusEmail(payload.email, payload.status, { bypassQueue: true });
    case 'TERMINATION':
      return sendTerminationEmail(payload.email, payload.reason, payload.attachments || [], { bypassQueue: true });
    case 'PROMOTION':
      return sendPromotionEmail(payload.email, payload.newRole, { bypassQueue: true });
    default:
      throw new Error(`Unknown email task type: ${task.type}`);
  }
};

module.exports = {
  sendEmail,
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendBulkUserWelcomeEmail,
  sendBadgeReceivedEmail,
  sendProfileUpdateEmail,

  sendInterviewScheduledEmail,
  sendApplicationStatusEmail,
  sendTerminationEmail,
  sendPromotionEmail,
  processEmailQueueMessage
};
