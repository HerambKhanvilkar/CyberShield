const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const User = require('../models/User');  // adjust path to your User model
const Badge = require('../models/Badge'); // adjust path to your Badge model
const JobResult = require('../models/JobResult'); // a simple Mongoose model for job results

// Dummy functions simulating DB look-up. Replace with your DB logic.
const checkDuplicateUser = (email, usersArray) => {
  // Returns true if user exists
  return usersArray.some(u => email === u);
};

const checkBadgeExists = (badgeId, badgesArray) => {
  return badgesArray.some(b => b == badgeId);
};

const nameRegex = /^[A-Za-z]+$/; // Allow only letters for names (adjust the regex as needed)

module.exports = function (agenda) {
  agenda.define('process csv file', async job => {
    try {
      // Store the result in the database
      await JobResult.findOneAndUpdate(
        { jobId: job.attrs._id },
        { status: 'processing', updatedAt: new Date() }
      );

      // Get data from job attributes:
      const { filePath, userId } = job.attrs.data;
      const validRows = [];
      const emails = [];
      const invalidRows = [];
      let rowCount = 0;

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', data => {
            rowCount++;
            // Basic required field validation
            if (!data._id || !data.email || !data.firstName || !data.lastName || !data.badgeIds) {
              invalidRows.push({ row: rowCount, error: "Missing required fields", data });
            } else {
              emails.push(data.email);
              validRows.push({ row: rowCount, ...data });
            }
          })
          .on('end', () => resolve())
          .on('error', error => reject(error));
      });

      // Clean up file after processing
      fs.unlinkSync(filePath);

      // Arrays to track processing errors
      let duplicateUsers = [];
      let nameMismatches = [];
      let invalidBadges = [];
      let invalidNames = [];
      let validUsers = [];

      let alreadyUsersExist = await User.find({ email: { $in: emails } })
      let usersExist = alreadyUsersExist.map(u => u.email);
      let badgesArray = await Badge.find({}, { id: 1, _id: 0 });

      await Promise.all(validRows.map(async (user) => {
        const { _id, email, firstName, lastName, badgeIds } = user;
        let userErrors = [];

        if (!nameRegex.test(firstName)) {
          userErrors.push(`Invalid firstName: ${firstName}`);
        }
        if (!nameRegex.test(lastName)) {
          userErrors.push(`Invalid lastName: ${lastName}`);
        }
        if (userErrors.length > 0) {
          invalidNames.push({ user, email, errors: userErrors });
          return;
        }

        let badgeIdsArray;
        try {
          badgeIdsArray = JSON.parse("[" + badgeIds + "]");
        } catch (err) {
          invalidBadges.push({ user, error: `Invalid badgeIds format` });
          return;
        }

        const badges = [];
        for (const id of badgeIdsArray) {
          if (!checkBadgeExists(id, badgesArray)) {
            badges.push(id);
          }
        }
        if ( badges.length > 0){
          invalidBadges.push({ user, error: `${String(badges)} Badge does not exist` });
        }
        if (badges.length !== badgeIdsArray.length) {
          return;
        }

        if (checkDuplicateUser(email, usersExist)) {
          duplicateUsers.push({user,  error: "User Already Exist." });
          duplicateUsers.push({user,  error: "User Already Exist." });
          return;
        }


        // const password = 'Pass@123';
        // const hashedPassword = await bcrypt.hash(password, 10);

        validUsers.push(user);
      }));

      const errorSummary = {
        duplicateUsers,
        invalidNames,
        invalidBadges,
        invalidRows
      };

      // Optionally, you can now insert validUsers into the DB.
      // await User.insertMany(validUsers);

      // Logging the result. In real application you might want to write the summary in a DB or send an email.
      const resultData = {
        message: "CSV file processed with preview",
        errors: errorSummary,
        validUsers
      };

      // Update JobStatus to "completed" with result details
      await JobResult.findOneAndUpdate(
        { jobId: job.attrs._id },
        { status: 'completed', result: resultData, updatedAt: new Date() }
      );


    } catch (error) {
      console.error("Error in CSV processing job:", error);
      // Optionally update job metadata or retry later.
      await JobResult.findOneAndUpdate(
        { jobId: job.attrs._id },
        { status: 'failed', updatedAt: new Date(), result: { error: error.message } }
      );

      throw error;
    }

  });
};
