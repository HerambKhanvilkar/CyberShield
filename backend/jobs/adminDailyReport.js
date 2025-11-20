module.exports = function(agenda) {
  const User = require('../models/User');
  const Badge = require('../models/Badge');
  const { sendAdminDailyReport } = require('../services/emailService');
  const logger = require('../logger');

  agenda.define('admin daily report', async job => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dateLabel = now.toLocaleDateString();

      // Counts
      const totalUsers = await User.countDocuments();
      const newUsers = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
      const totalBadges = await Badge.countDocuments();
      const newBadges = await Badge.countDocuments({ createdAt: { $gte: oneDayAgo } });

      // Badges awarded in last 24 hours
      const badgesAwarded = await User.aggregate([
        { $unwind: '$badges' },
        { $match: { 'badges.earnedDate': { $gte: oneDayAgo } } },
        { $group: { _id: '$badges.badgeId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const logs = [
        { time: now.toISOString(), action: 'summary', target: 'daily-stats', status: 'ok', details: {
          totalUsers, newUsers, totalBadges, newBadges, badgesAwardedCount: badgesAwarded.length
        } }
      ];

      // Find admins who opted in (adminDaily !== false) — default is true
      const admins = await User.find({ isAdmin: true }).select('email firstName emailPreferences');

      for (const admin of admins) {
        try {
          const prefs = admin.emailPreferences || {};
          // Treat `adminDaily` as opt-in by default. If it's undefined, default to true.
          const adminDailyEnabled = (typeof prefs.adminDaily === 'undefined') ? true : !!prefs.adminDaily;
          if (!adminDailyEnabled) {
            logger.info(`Skipping admin daily for ${admin.email} (opted out)`);
            continue;
          }

          await sendAdminDailyReport(
            admin.email,
            admin.firstName || admin.email,
            dateLabel,
            // include a compact payload: counts + top awarded badges
            [{ totalUsers, newUsers, totalBadges, newBadges, topAwarded: badgesAwarded.slice(0,5) }]
          );

          logger.info(`Admin daily report sent to ${admin.email}`);
        } catch (err) {
          logger.error(`Failed to send admin daily to ${admin.email}:`, err);
        }
      }

    } catch (err) {
      logger.error('Error running admin daily report job:', err);
    }
  });
};
