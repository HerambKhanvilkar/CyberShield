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

module.exports = function (agenda) {
  agenda.define('reprocess revision', async job => {
    try {
      const { jobId, revision, userId } = job.attrs.data;
      console.log(" jobId, revision, userId ",  jobId, Object.keys(revision), userId );
      // Store the result in the database
      // Fetch the JobResult document; ensure the user is the owner.
      const JobResultDoc = await JobResult.findOne({ jobId, userId });
      if (!JobResultDoc) {
        throw new Error('JobResult document not found for the given user and jobId.');
      }

      await JobResult.findOneAndUpdate(
        { jobId: job.attrs._id },
        { revisionStatus: 'processing', updatedAt: new Date() }
      );

      const revisionRows = [];
      const emails = [];
      const validRevisionRows = [];
      const invalidRevisionUsers = [];
      let rowCount = 0;

      if (revision && Array.isArray(revision) && revision.length > 0) {
          console.log("inside revision data");
        // Basic required field validation
        revision.forEach( data => {
          console.log("further inside inside revision data");

          if(data.row){
          console.log("row argument passed");
            revisionRows.push(data.row);
            if (!data.email || !data.firstName || !data.lastName || !data.badgeIds) {
          console.log("all !!NOT!! props passed for the object");
              invalidRevisionUsers.push({ 
                row: rowCount, error: "Missing required fields", data 
              });
            } else {
          console.log("all props passed for the object");
              emails.push(data.email);
              validRevisionRows.push({ row: rowCount, ...data });
            }
          }

        });
      }
      JobResultDoc.result.validUsers = JobResultDoc.result.validUsers
        .filter(user => 
          !revisionRows.some( row => 
            user.row == row 
          )
        );

      JobResultDoc.result.invalidUsers = JobResultDoc.result.invalidUsers
        .filter(user => 
          !revisionRows.some( row => 
            user.row === row 
          )
        );

      // Arrays to track processing errors
      let validUsers = [];

      let alreadyUsersExist = await User.find({ email: { $in: emails } })
      let usersExist = alreadyUsersExist.map(u => u.email);
      let badgesArray = (await Badge.find({}, { id: 1, _id: 0 }))
        .map(b => b.id);

      await Promise.all(validRevisionRows.map(async (user) => {
        const { email, firstName, lastName, badgeIds } = user;
        let userErrors = [];

        if (!nameRegex.test(firstName)) {
          userErrors.push(`Invalid firstName: ${firstName}`);
        }
        if (!nameRegex.test(lastName)) {
          userErrors.push(`Invalid lastName: ${lastName}`);
        }
        if (userErrors.length > 0) {
          invalidRevisionUsers.push({... user, errors: userErrors });
          return;
        }

        let badgeIdsArray;
        try {
          badgeIdsArray = JSON.parse("[" + badgeIds + "]");
        } catch (err) {
          invalidRevisionUsers.push({... user, error: `Invalid badgeIds format` });
          return;
        }

          console.log("badge format passed");
        const badges = [];
        for (const id of badgeIdsArray) {
          if (!checkBadgeExists(id, badgesArray)) {
            badges.push(id);
          }
        }
        if ( badges.length > 0){
          invalidRevisionUsers.push({... user, error: `${String(badges)} Badge does not exist` });
          return;
        }
          console.log("badge existence passed");
        
        if (checkDuplicateUser(email, usersExist)) {
          const existingUser = alreadyUsersExist
            .find(u => u.email === email);

          const nameError = [];
          if (firstName != existingUser.firstName){
            nameError.push(`User already exist with firstName ${existingUser.firstName}`)
          }

          if (lastName != existingUser.lastName){
            nameError.push(`User already exist with lastName ${existingUser.lastName}`)
          }

          if (nameError.length > 0){
            invalidRevisionUsers.push({... user,  error: String(nameError) })
            return;
          }

          invalidRevisionUsers.push({... user,  error: "User already exist." });
          return;
        }

          console.log("name missmatch and duplicate passed");

        // const password = 'Pass@123';
        // const hashedPassword = await bcrypt.hash(password, 10);

        validUsers.push({... user, error: null});
          console.log("bro is valid now");
      }));

      // Optionally, you can now insert validUsers into the DB.
      // await User.insertMany(validUsers);

      // Logging the result. In real application you might want to write the summary in a DB or send an email.
      console.log("JobResultDoc.result.validUsers", JobResultDoc.result.validUsers);
      if (invalidRevisionUsers.length > 0){
      JobResultDoc.result.invalidUsers = 
        [... JobResultDoc.result.invalidUsers, ... invalidRevisionUsers]
      }

      console.log("JobResultDoc.result.validUsers", JobResultDoc.result.validUsers);
      if (validUsers.length > 0){
      JobResultDoc.result.validUsers = 
        [... JobResultDoc.result.validUsers, ...validUsers]
      }
      console.log("JobResultDoc.result.validUsers", JobResultDoc.result.validUsers);

      const resultData = {
        message: "CSV file reprocessed with preview",
        invalidRevisionUsers,
        validUsers
      };

      console.log(JobResultDoc.result);

      // Update JobResult to "completed" with result details
      await JobResult.findOneAndUpdate(
        { jobId},
        { 
          revisionStatus: 'completed', 
          revision: resultData,  updatedAt: new Date() ,
          "result.validUsers": JobResultDoc.result.validUsers,
          "result.invalidUsers": JobResultDoc.result.invalidUsers,
        }
      );

    } catch (error) {
      console.error("Error in CSV processing job:", error);
      // Optionally update job metadata or retry later.
      await JobResult.findOneAndUpdate(
        { jobId},
        { status: 'failed', updatedAt: new Date(), result: { error: error.message } }
      );

      throw error;
    }

  });
};
