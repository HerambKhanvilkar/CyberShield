const Badge = require('../models/Badge');
const User = require('../models/User');
const { sendBadgeReceivedEmail, sendProfileUpdateEmail } = require('./emailService');

// Helper to award composite badges when prerequisites are satisfied
async function awardCompositeBadgesForUser(user) {
  // user is a Mongoose document (not lean)
  const awarded = [];
  let madeAward = true;

  while (madeAward) {
    madeAward = false;

    // Build a set of owned badge _ids (as strings)
    const ownedBadgeIds = [];
    // Convert user's badgeId entries to actual Badge _ids by querying Badge collection
    const badgeIdStrings = user.badges.map(b => b.badgeId).filter(Boolean);
    const numericIds = badgeIdStrings.map(x => parseInt(x)).filter(n => !isNaN(n));
    const stringIds = badgeIdStrings.filter(x => isNaN(parseInt(x)));
    const query = { $or: [] };
    if (stringIds.length > 0) query.$or.push({ badgeId: { $in: stringIds } });
    if (numericIds.length > 0) query.$or.push({ id: { $in: numericIds } });
    const ownedDocs = query.$or.length > 0 ? await (require('../models/Badge')).find(query).select('_id') : [];
    const ownedSet = new Set(ownedDocs.map(d => String(d._id)));

    // Find candidate composite badges that have requires
    const composites = await (require('../models/Badge')).find({ requires: { $exists: true, $ne: [] } });

    for (const comp of composites) {
      // Skip if user already has this badge
      const hasComp = user.badges.some(b => String(b.badgeId) === String(comp.badgeId) || String(b.badgeId) === String(comp.id));
      if (hasComp) continue;

      const reqIds = (comp.requires || []).map(r => String(r));
      const allOwned = reqIds.every(rid => ownedSet.has(rid));
      if (allOwned) {
        // award composite badge
        const updated = await (require('../models/Badge')).findOneAndUpdate({ _id: comp._id }, { $inc: { certificateCounter: 1 } }, { new: true });
        const counter = updated.certificateCounter || 1;
        // Use 4-digit sequence for per-issuer counter
        const seq = String(counter).padStart(4, '0');
        // Format abbreviation to 4 chars: pad right with '0' if shorter, trim to 4 if longer
        const fmtAbbr = (val) => {
          if (!val) return ''.padEnd(4, '0');
          const s = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
          return s.length >= 4 ? s.slice(0,4) : s.padEnd(4, '0');
        };
        const abbrPart = updated.abbreviation && String(updated.abbreviation).trim() !== ''
          ? fmtAbbr(updated.abbreviation)
          : (updated.badgeId ? fmtAbbr(String(updated.badgeId).slice(0,4)) : fmtAbbr(String(updated.id)));

        // badge id (numeric id) is mandatory and used as-is (no fixed padding)
        const badgeIdPart = String(updated.id);
        const certificateId = `${abbrPart}${badgeIdPart}${seq}`;
        console.log(`Auto-awarded certificateId ${certificateId} for composite badge ${updated._id} (abbreviation=${updated.abbreviation || ''})`);
        user.badges.push({ badgeId: updated.badgeId || String(updated.id), earnedDate: new Date(), certificateId });
        await user.save();

        // Send email respecting preferences
        try {
          const prefs = user.emailPreferences || {};
          if (prefs.badgeReceived !== false) {
            const backendBase = process.env.BACKEND_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || '3001'}`;
            const imageUrl = updated && updated.id ? `${backendBase}/api/badge/images/${updated.id}` : `${backendBase}/api/badge/images/${updated.badgeId || updated.id}`;
            await sendBadgeReceivedEmail(user.email, updated.name, updated.description || '', null, certificateId, imageUrl);
          }
        } catch (emailErr) {
          console.error('Failed to send composite badge email:', emailErr);
        }

        awarded.push(updated);
        madeAward = true;
      }
    }
  }

  return awarded;
}

// Revoke composite badges for a user when any prerequisite(s) are removed
async function revokeDependentBadgesForUser(user, removedBadgeIds = []) {
  const BadgeModel = require('../models/Badge');
  const revoked = [];
  // Normalize removed ids to strings
  let toCheckIds = (removedBadgeIds || []).map(id => String(id));

  // Loop until no more revocations (cascading)
  let madeChange = true;
  while (madeChange && toCheckIds.length > 0) {
    madeChange = false;
    // Refresh user's badges set (ensure we operate on latest)
    await user.reload?.();

    // Build a set of owned Badge _ids by resolving user's badgeId entries to Badge docs
    const badgeIdStrings = (user.badges || []).map(b => b.badgeId).filter(Boolean);
    const numericIds = badgeIdStrings.map(x => parseInt(x)).filter(n => !isNaN(n));
    const stringIds = badgeIdStrings.filter(x => isNaN(parseInt(x)));
    const query = { $or: [] };
    if (stringIds.length > 0) query.$or.push({ badgeId: { $in: stringIds } });
    if (numericIds.length > 0) query.$or.push({ id: { $in: numericIds } });
    const ownedDocs = query.$or.length > 0 ? await BadgeModel.find(query).select('_id') : [];
    const ownedSet = new Set(ownedDocs.map(d => String(d._id)));

    // Find composite badges that reference any of the toCheckIds
    const candidates = await BadgeModel.find({ requires: { $in: toCheckIds } });
    const newlyRevokedIds = [];

    for (const comp of candidates) {
      // If user does not have this composite, skip
      const hasComp = user.badges.some(b => String(b.badgeId) === String(comp.badgeId) || String(b.badgeId) === String(comp.id));
      if (!hasComp) continue;

      // Check if all requirements are still satisfied
      const reqIds = (comp.requires || []).map(r => String(r));
      const allOwned = reqIds.every(rid => ownedSet.has(rid));
      if (!allOwned) {
        // Remove composite from user's badges
        const index = user.badges.findIndex(b => String(b.badgeId) === String(comp.badgeId) || String(b.badgeId) === String(comp.id));
        if (index !== -1) {
          const removedEntry = user.badges.splice(index, 1)[0];
          await user.save();
          revoked.push({ badge: comp, removedEntry });
          newlyRevokedIds.push(String(comp._id));
          madeChange = true;

          // Send profile update / revocation email to user respecting prefs
          try {
            const prefs = user.emailPreferences || {};
            if (prefs.profileUpdate !== false) {
              await sendProfileUpdateEmail(
                user.email,
                'badge_stripped',
                comp.name,
                '<p style="margin-top: 10px;">A prerequisite was removed, so this badge was revoked.</p>'
              );
            }
          } catch (emailErr) {
            console.error('Failed to send composite revoke email:', emailErr);
          }
        }
      }
    }

    // Prepare next iteration to check composites depending on newly revoked badges
    toCheckIds = newlyRevokedIds;
  }

  return revoked;
}

module.exports = {
  awardCompositeBadgesForUser,
  revokeDependentBadgesForUser,
};

