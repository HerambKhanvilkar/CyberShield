const ContributionLog = require('../models/Project/ContributionLog');

async function markContributorLeave (projectId, profileId) {
    await ContributionLog.findOneAndUpdate(
        { projectId, profileId, isActive: true },
        {
            leftAt: new Date(),
            isActive: false
        }
    );
}

async function markContributorJoin (projectId, profileId, role){
    await ContributionLog.create({
        projectId,
        profileId,
        role: role
    })
}

module.exports = {
    markContributorJoin,
    markContributorLeave
}