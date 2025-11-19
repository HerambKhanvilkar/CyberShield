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

function checkNameMisMatch(fname, lname, userList){
}

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
      const invalidUsers = [];
      let rowCount = 0;

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', data => {
            rowCount++;
            // Basic required field validation
            if (!data.email || !data.firstName || !data.lastName || !data.badgeIds) {
              invalidUsers.push({ row: rowCount, error: "Missing required fields",... data  });
            } else {
              emails.push(data.email);
              validRows.push({ row: rowCount, ... data });
            }
          })
          .on('end', () => resolve())
          .on('error', error => reject(error));
      });

      // Clean up file after processing
      fs.unlinkSync(filePath);

      // Arrays to track processing errors
      let validUsers = [];

      let alreadyUsersExist = await User.find({ email: { $in: emails } })
      let usersExist = alreadyUsersExist.map(u => u.email);
      // Collect both numeric ids and string badgeIds so CSV can refer to either
      let badgesRaw = await Badge.find({}, { id: 1, badgeId: 1, _id: 0 });
      let badgesArray = [];
      badgesRaw.forEach(b => {
        if (b.id !== undefined && b.id !== null) badgesArray.push(b.id);
        if (b.badgeId) badgesArray.push(b.badgeId);
      });

      await Promise.all(validRows.map(async (user) => {
        const { email, firstName, lastName, badgeIds } = user;
        let userErrors = [];

        if (!nameRegex.test(firstName)) {
          userErrors.push(`Invalid firstName: ${firstName}`);
        }
        if (!nameRegex.test(lastName)) {
          userErrors.push(`Invalid lastName: ${lastName}`);
        }
        if (userErrors.length > 0) {
          invalidUsers.push({... user, errors: userErrors });
          return;
        }

        let badgeIdsArray;
        try {
          badgeIdsArray = JSON.parse("[" + badgeIds + "]");
        } catch (err) {
          invalidUsers.push({... user, error: `Invalid badgeIds format` });
          return;
        }

        const badges = [];
        for (const id of badgeIdsArray) {
          if (!checkBadgeExists(id, badgesArray)) {
            badges.push(id);
          }
        }
        if ( badges.length > 0){
          invalidUsers.push({... user, error: `${String(badges)} Badge does not exist` });
          return;
        }
        
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
            invalidUsers.push({... user,  error: String(nameError) })
            return;
          }

          invalidUsers.push({... user,  error: "User already exist." });
          return;
        }


        // const password = 'Pass@123';
        // const hashedPassword = await bcrypt.hash(password, 10);

        validUsers.push({... user, error: null});
      }));

      // Optionally, you can now insert validUsers into the DB.
      // await User.insertMany(validUsers);

      // Logging the result. In real application you might want to write the summary in a DB or send an email.
      const resultData = {
        message: "CSV file processed with preview",
        invalidUsers,
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
