const fs = require('fs');
const User = require('../models/User');  // adjust path to your User model
const Badge = require('../models/Badge'); // adjust path to your Badge model
const JobResult = require('../models/JobResult'); // a simple Mongoose model for job results

// Dummy functions simulating DB look-up. Replace with your DB logic.
const checkDuplicateUser = (email, usersArray) => {
  // Returns true if user exists
  return usersArray.some(u => email === u);
};

function checkNameMisMatch(fname, lname, userList){
}

const checkBadgeExists = (badgeId, badgesArray) => {
  return badgesArray.some(b => b == badgeId);
};

const nameRegex = /^[A-Za-z]+$/; // Allow only letters for names (adjust the regex as needed)


async function validateRevision (data){

  const {  email, firstName, lastName, badgeIds } = data;

  if (!email || !firstName || !lastName || !badgeIds) {
    return { error: "Missing required fields" }
  }

  let isUserExist = await User.findOne({ email });

  let badgesArray = (await Badge.find({}, { id: 1, _id: 0 }))
    .map(b => b.id);

  let userErrors = [];

  if (!nameRegex.test(firstName)) {
    userErrors.push(`Invalid firstName: ${firstName}`);
  }
  if (!nameRegex.test(lastName)) {
    userErrors.push(`Invalid lastName: ${lastName}`);
  }
  // firstName lastName error
  if (userErrors.length > 0) {
    return ({errors: userErrors });
  }

  let badgeIdsArray;

  try {
    badgeIdsArray = JSON.parse("[" + badgeIds + "]");
  } catch (err) {
    return ({ error: `Invalid badgeIds format` });
  }

  console.log("badge format passed");
  const badges = [];
  for (const id of badgeIdsArray) {
    if (!checkBadgeExists(id, badgesArray)) {
      badges.push(id);
    }
  }
  if ( badges.length > 0){
    return {error: `${String(badges)} Badge does not exist` } 
  }

  console.log("badge existence passed");

  if (isUserExist) {
    const nameError = [];
    if (firstName != isUserExist.firstName){
      nameError.push(`User already exist with firstName ${isUserExist.firstName}`)
    }

    if (lastName != isUserExist.lastName){
      nameError.push(`User already exist with lastName ${isUserExist.lastName}`)
    }

    if (nameError.length > 0){
      return { error: String(nameError) }
    }

    return { error: "User already exist." }

  }

  console.log("bro is valid now");
  return { error: null}
}


async function revisionCsvData (modifyData) {
    try {
      const { jobId, revision, userId, JobResultDoc } = modifyData;
      console.log(" jobId, revision, userId ",  jobId, Object.keys(revision), userId );

      if (!JobResultDoc) {
        throw new Error('JobResult document not found for the given user and jobId.');
      }

      JobResultDoc.result.validUsers = JobResultDoc.result.validUsers
        .filter(user => user.row !== revision.row )

      JobResultDoc.result.invalidUsers = JobResultDoc.result.invalidUsers
        .filter(user => user.row !== revision.row )

      const result = await validateRevision(revision);
      revision.error = result.error;

      if (result.error){
        JobResultDoc.result.invalidUsers.push(revision)
      } else {
        JobResultDoc.result.validUsers.push(revision);
      }

      JobResultDoc.result.revision = revision;
      JobResultDoc.result.revisionStatus = 'completed';

      await JobResult.findOneAndUpdate(
        { jobId },
        { $set: { result: JobResultDoc.result } }
      );

      return JobResultDoc;

    } catch (error) {
      console.error("Error in CSV processing job:", error);
      // Optionally update job metadata or retry later.
      await JobResult.findOneAndUpdate(
        { jobId},
        { revisionStatus: 'failed', updatedAt: new Date(), result: { error: error.message } }
      );

      throw error;
    }

};

module.exports = {
  revisionCsvData
}
