const { authenticateJWT } = require('../middleware/auth');
const express = require("express");
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Badge = require("../models/Badge");
const BadgeImage = require("../models/BadgeImage");
const User = require("../models/User");
const JobResult = require("../models/JobResult");
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');
const bcrypt = require("bcrypt");
const { Parser } = require('json2csv');
const agenda = require('../worker.js'); // path to your agenda initialization module
const { validateMIMEType } = require("validate-image-type");
const sharp = require('sharp');
const { 
  sendBulkUserWelcomeEmail,
  sendBadgeReceivedEmail,
  sendProfileUpdateEmail 
} = require("../services/emailService");

const uploadImage = multer({ 
  limits: { fileSize: 5 * 1000 * 1000 }, // 5MB max file size
  fileFilter: function(req, file, callback) {
    let fileExtension = (file.originalname.split('.')[file.originalname.split('.').length-1]).toLowerCase(); // convert extension to lower case
    if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
      return callback('Wrong file type', false);
    }
    file.extension = fileExtension.replace(/jpeg/i, 'jpg'); // all jpeg images to end .jpg
    callback(null, true);
  },
  dest: 'badges/' 
});

const uploadCsv = multer({ 
  limits: { fileSize: 5 * 1000 * 1000 }, // 5MB max file size
  fileFilter: function(req, file, callback) {
    let fileExtension = (file.originalname.split('.')[file.originalname.split('.').length-1]).toLowerCase(); // convert extension to lower case
    if (["csv", "xlsx"].indexOf(fileExtension) === -1) {
      return callback('Wrong file type', false);
    }
    file.extension = fileExtension.replace(/jpeg/i, 'jpg'); // all jpeg images to end .jpg
    callback(null, true);
  },
  dest: 'csv-files/' 
});

const asyncWrapper = fn => {
    return (req, res, next) => {
        return fn(req, res, next).catch(next);
    }
};

const getUsername = async (authHeader) => {
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  const user = await User.findOne({
    _id: decoded.id,
  });

  if (!user) {
    return null;
  }
  return user.email;
}

// Dummy functions simulating DB look-up. Replace with your DB logic.
const checkDuplicateUser = (email, usersArray) => {
  // Returns true if user exists
  return usersArray.some(u => email === u);
};

const checkBadgeExists = (badgeId, badgesArray) => {
  return badgesArray.some(b => b == badgeId);
};

const nameRegex = /^[A-Za-z]+$/; // Allow only letters for names (adjust the regex as needed)

// Add Course
router.post('/users/courses', authenticateJWT, async (req, res) => {
    const { email, course } = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) return res.status(404).send('User not found');

        user.courses.push(course);
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Update course
router.put('/users/courses/:courseIndex', authenticateJWT, async (req, res) => {
    const { courseIndex } = req.params;
    const { email, course } = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) return res.status(404).send('User not found');

        if (user.courses[courseIndex] === undefined) {
            return res.status(404).send('Course not found');
        }

        user.courses[courseIndex] = course;
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Delete course
router.delete('/users/courses/:courseIndex', authenticateJWT, async (req, res) => {
    const { courseIndex } = req.params;
    const { email } = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) return res.status(404).send('User not found');

        if (user.courses[courseIndex] === undefined) {
            return res.status(404).send('Course not found');
        }

        user.courses.splice(courseIndex, 1);
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});




// Add achievement
router.post('/users/achievements', authenticateJWT, async (req, res) => {
    const { email, achievement } = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) return res.status(404).send('User not found');

        user.achievements.push(achievement);
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Update achievement
router.put('/users/achievements/:achievementIndex', authenticateJWT, async (req, res) => {
    const { achievementIndex } = req.params;
    const { email, achievement } = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) return res.status(404).send('User not found');

        if (user.achievements[achievementIndex] === undefined) {
            return res.status(404).send('Achievement not found');
        }

        user.achievements[achievementIndex] = achievement;
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Delete achievement
router.delete('/users/achievements/:achievementIndex', authenticateJWT, async (req, res) => {
    const { achievementIndex } = req.params;
    const { email } = req.body;

    try {
        const user = await User.findOne({email});
        if (!user) return res.status(404).send('User not found');

        if (user.achievements[achievementIndex] === undefined) {
            return res.status(404).send('Achievement not found');
        }

        user.achievements.splice(achievementIndex, 1);
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});



router.put(
  "/badge/import", 
  authenticateJWT, 
  uploadImage.single('image'), 
  async (req, res, next) => {
  try {

    const { id, course, name, description, level, vertical, skillsEarned } = req.body;
    var existingBadge = null;
    var existingBadgeImage = null;
    if (!id){
      return res.status(401).json({ message: "Badge Id required" });
    }
    // allow lookup by numeric id or badgeId
    existingBadge = await Badge.findOne({ id }) || await Badge.findOne({ badgeId: String(id) });
    existingBadgeImage = await BadgeImage.findOne({ id });

    if (!existingBadge){
      return res.status(401).json({ message: "Badge yet to be created" });
    }


    if (skillsEarned && Array.isArray(skillsEarned) && skillsEarned.length > 0) { existingBadge["skillsEarned"] = skillsEarned } 
    if (vertical) { existingBadge["vertical"] = vertical } 
    if (level) { existingBadge["level"] = level } 
    if (description) { existingBadge["description"] = description } 
    if (name) { existingBadge["name"] = name } 
    if (course) { existingBadge["course"] = course } 

    if (req.file){
    console.log("resizing");
    console.log(existingBadge);

      const image = sharp(req.file.path);
      image.metadata() // get image metadata for size
        .then(function(metadata) {
          if (metadata.width > 400 || metadata.height > 400) {
            return image.resize({ width: 400, height: 400 }).toBuffer(); // resize if too big
          } else {
            return image.toBuffer();
          }
        })
        .then(function(data) { // upload to s3 storage
          const badgeImageObj = {
            id, name: req.body.name || existingBadge["name"],
            image: data,
            contentType: req.file.mimetype // Use the uploaded file's mimetype
          };

          if (!existingBadgeImage){
            existingBadgeImage =  new BadgeImage(badgeImageObj);
          } else {
            existingBadgeImage["image"] = data;            
            existingBadge["contentType"]= req.file.mimetype;
          }
          console.log('badeImageObj', badgeImageObj);
          existingBadgeImage.save();
        })
    }
    existingBadge.save();
    res.status(200).json({ message: 'Badge Modified successfully', data: existingBadge });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// upload badge
router.post(
  "/badge/import", 
  authenticateJWT, 
  uploadImage.single('image'), 
  asyncWrapper(async (req, res, next) => {
    try {
      const { id, name, description, level, vertical, skillsEarned, course, badgeId } = req.body;
      if ( !id || !name || !description || !level || !vertical || skillsEarned.length === 0 ){
        return res.status(401).json({ message: "Missing Fields!" });
      }
      const badgeExist = await Badge.findOne({ id }) || await Badge.findOne({ badgeId: String(badgeId || '') });
      const badgeImageExist = await BadgeImage.findOne({id});

      if (badgeExist){
        return res.status(401).json({ message: "Badge already exists" });
      }

      if (badgeImageExist){
        return res.status(401).json({ message: "Badge Image already exists" });
      }


      // Construct badge object. Accept `badgeId` from client or build from name+id fallback
      const badgeObj = { id, name, description, level, vertical, skillsEarned };
      if (badgeId) { badgeObj.badgeId = String(badgeId); }
      else if (name && id) {
        // derive prefix from first two words' initials
        const parts = String(name).trim().split(/\s+/);
        let prefix = (parts[0] || '').charAt(0) + (parts[1] ? parts[1].charAt(0) : (parts[0] || '').charAt(1) || 'X');
        prefix = prefix.toUpperCase().replace(/[^A-Z]/g, '').padEnd(2, 'X').slice(0,2);
        badgeObj.badgeId = `${prefix}${String(id).padStart(6,'0')}`;
      }
      if (course) { badgeObj['course'] = course }

      if (req.file){
        const image = sharp(req.file.path);
        image.metadata() // get image metadata for size
          .then(function(metadata) {
            if (metadata.width > 400 || metadata.height > 400) {
              console.log('resizing Image');
              return image.resize({ width: 400, height: 400 }).toBuffer(); // resize if too big
            } else {
              return image.toBuffer();
            }
          })
          .then(function(data) { // upload to s3 storage
            const badgeImageObj = {
              id, name,
              image:  data,
              contentType: req.file.mimetype // Use the uploaded file's mimetype
            };
            const newBadge = new Badge(badgeObj);
            const newBadgeImage = new BadgeImage(badgeImageObj);
            console.log('badeImageObj', badgeImageObj);
            newBadge.save();
            newBadgeImage.save();
            return res.status(200).json({ message: 'Badge created successfully', data: newBadge });
          })

      }

      // const badgeImageObj = {
      //   id, name,
      //   image:  fs.readFileSync(path.join(__dirname, '../uploads/', req.file.filename)),
      //   contentType: req.file.mimetype // Use the uploaded file's mimetype
      // };

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  })
)

// Get Courses
router.get("/badges/courses", async (req, res) => {
  try {
    const uniqueCourses = await Badge.aggregate([
      { $group: { _id: "$course" } }, // Group by skillsEarned to get unique values
      { $project: { course: "$_id", _id: 0 } } // Project the results to a more readable format
    ]);

    res.status(200).json({ message: 'All Unique Courses.', data: uniqueCourses.map(course => course.course)});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Get Skills 
router.get("/badges/skills", async (req, res) => {
  try {
    const uniqueSkills = await Badge.aggregate([
      { $unwind: "$skillsEarned" }, // Unwind the skillsEarned array
      { $group: { _id: "$skillsEarned" } }, // Group by skillsEarned to get unique values
      { $project: { skill: "$_id", _id: 0 } } // Project the results to a more readable format
    ]);

    res.status(200).json({ message: 'All Unique Skills.', data: uniqueSkills.map(skill => skill.skill)});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Verticals 
router.get("/badges/verticals", async (req, res) => {
  try {
     const uniqueVerticals = await Badge.aggregate([
      { $group: { _id: "$vertical" } }, // Group by vertical to get unique values
      { $project: { vertical: "$_id", _id: 0 } } // Project the results to a more readable format
    ]);
    res.status(200).json({ message: 'All Unique Verticals.', data: uniqueVerticals.map(vertical => vertical.vertical)});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// upload badge
router.post("/user/delete", authenticateJWT, async (req, res) => {
  try {
    const { email } = req.body;

    const authHeader = req.headers.authorization;

    const adminUsername = await getUsername(authHeader);

    const adminUser = await User.findOne({ email: adminUsername });
    
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.deleteOne({email});

    res.status(200).json({ message: 'User Removed Successfly', email});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/user/create", authenticateJWT, async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    const authHeader = req.headers.authorization;

    const adminUsername = await getUsername(authHeader);

    const adminUser = await User.findOne({ email: adminUsername });
    
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(404).json({ message: "User already exists" });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({ 
      email, 
      firstName, 
      lastName, 
      password: hashedPassword,
      isAdmin: false // Default to non-admin
    });
    await newUser.save();

    res.status(200).json({ message: 'User created Successfly', email});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//file upload
router.post("/users/import/preview", authenticateJWT, uploadCsv.single('file'), async (req, res) => {
  try {
    // Ensure file exists
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    
    const authHeader = req.headers.authorization;
    const email = await getUsername(authHeader);

    // Enqueue the CSV processing job, passing the file path.
    const job = await agenda.schedule('now', 'process csv file', { filePath: req.file.path, userId: email });

    // Create initial job status record
    await JobResult.create({
      jobId: job.attrs._id,
      userId: email,
      status: 'pending'
    });


    return res.status(202).json({
      message: "CSV file successfully queued for processing.",
      jobId: job.attrs._id
    });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//file upload
router.post("/users/import/:jobId",authenticateJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const  { upsert }  = req.body;
    const authHeader = req.headers.authorization;
    const userId = await getUsername(authHeader);
    const jobStatusDoc = await JobResult.findOne({ jobId, userId});

    if (!jobStatusDoc) {
      return res.status(404).json({ message: "Job not found." });
    }
    
    // Generate random password function
    const generateRandomPassword = () => {
      const length = 12;
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '!@#$%^&*';
      const allChars = uppercase + lowercase + numbers + special;
      
      let password = '';
      // Ensure at least one of each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += special[Math.floor(Math.random() * special.length)];
      
      // Fill the rest randomly
      for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    // Store plain text passwords temporarily to send in emails
    const userPasswordMap = new Map();
    
    const usersToBeInserted = await Promise.all(jobStatusDoc.result.validUsers.map(async u => {
      const badgeIdsArray = JSON.parse("[" + u.badgeIds + "]");
      const badges = [];
      for (const b of badgeIdsArray) {
        // Find badge by numeric id or badgeId string
        let badgeDoc = await Badge.findOne({ id: b }) || await Badge.findOne({ badgeId: String(b) });
        if (!badgeDoc) {
          // push the raw badge id so validation elsewhere can pick it up
          badges.push({ badgeId: b, earnedDate: new Date() });
          continue;
        }
        // increment certificateCounter and build certificateId
        const updated = await Badge.findOneAndUpdate({ _id: badgeDoc._id }, { $inc: { certificateCounter: 1 } }, { new: true });
        const counter = updated.certificateCounter || 1;
        const seq = String(counter).padStart(3, '0');
        const baseBadgeId = updated.badgeId || String(updated.id).padStart(6, '0');
        const certificateId = `${baseBadgeId}${seq}`;
        badges.push({ badgeId: updated.badgeId || String(updated.id), earnedDate: new Date(), certificateId });
      }

      // Generate unique random password for this user
      const plainPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      // Store for email sending
      userPasswordMap.set(u.email, plainPassword);

      return {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        badges: badges,
        password: hashedPassword
      };
    }));

    let usersToBeUpdated = []

    if ( upsert ) { 
      for ( u of jobStatusDoc.result.invalidUsers){
          if (u.error.includes('Badge')){
            return res.status(401)
              .json({message: 'Badge related Errors need resolution.'});
          }
          const { email, firstName, lastName, badgeIds } = u;

          const newBadges = ( JSON.parse("[" + badgeIds + "]") )
              .map(b => {return { badgeId: b, earnedDate: new Date() }});
          usersToBeUpdated.push({
            updateOne: {
              filter: { email },
              update: { 
                '$set': { email, firstName, lastName, },
                '$push': { badges: { $each: newBadges } },
              },
              upsert: false,
            }
          });
        };
    }


    if ( usersToBeInserted.length > 0){
      const inserted = await User.insertMany(usersToBeInserted);
      console.log("insert");
      
      // Send welcome emails to new users with their unique passwords
      for (const user of usersToBeInserted) {
        try {
          const plainPassword = userPasswordMap.get(user.email);
          await sendBulkUserWelcomeEmail(user.email, plainPassword);
          console.log(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send welcome email to ${user.email}:`, emailError);
          // Continue processing other users even if one email fails
        }
      }

      // Send badge received emails for badges assigned during insert
      for (const user of usersToBeInserted) {
        if (!user.badges || user.badges.length === 0) continue;
        for (const badgeEntry of user.badges) {
          try {
            // Try to resolve badge name/description from Badge collection
            const badgeDoc = await Badge.findOne({ badgeId: String(badgeEntry.badgeId) }) || await Badge.findOne({ id: badgeEntry.badgeId });
            const badgeName = (badgeDoc && badgeDoc.name) ? badgeDoc.name : (badgeEntry.badgeId || 'a badge');
            const badgeDesc = (badgeDoc && badgeDoc.description) ? badgeDoc.description : '';
            const backendBase = process.env.BACKEND_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || '3001'}`;
            const imageUrl = badgeDoc && badgeDoc.id ? `${backendBase}/api/badge/images/${badgeDoc.id}` : `${backendBase}/api/badge/images/${badgeEntry.badgeId}`;
            const certificateId = badgeEntry.certificateId || null;
            await sendBadgeReceivedEmail(user.email, badgeName, badgeDesc, null, certificateId, imageUrl);
            console.log(`Badge received email sent to ${user.email} for ${badgeName}`);
          } catch (emailError) {
            console.error(`Failed to send badge email to ${user.email} for badge ${badgeEntry.badgeId}:`, emailError);
            // Don't fail the whole import if email sending fails
          }
        }
      }

      // Clear the password map for security
      userPasswordMap.clear();
    }
    if ( usersToBeUpdated.length > 0){
      await User.bulkWrite(usersToBeUpdated);
      console.log("update");
      
      // Send profile update + badge received notification to updated users
      for (const updateOp of usersToBeUpdated) {
        try {
          const email = updateOp.updateOne.filter.email;
          // Send profile update
          await sendProfileUpdateEmail(
            email,
            'profile_update',
            '',
            'Your profile has been updated with new badges by an administrator.'
          );
          console.log(`Profile update email sent to ${email}`);
        } catch (emailError) {
          console.error(`Failed to send update email to ${updateOp.updateOne.filter.email}:`, emailError);
        }

        // If there are new badges in the write op, send badge received emails
        try {
          const newBadges = (updateOp.updateOne.update && updateOp.updateOne.update.$push && updateOp.updateOne.update.$push.badges && updateOp.updateOne.update.$push.badges.$each) ? updateOp.updateOne.update.$push.badges.$each : [];
          for (const badgeEntry of newBadges) {
            try {
              const badgeDoc = await Badge.findOne({ badgeId: String(badgeEntry.badgeId) }) || await Badge.findOne({ id: badgeEntry.badgeId });
              const badgeName = (badgeDoc && badgeDoc.name) ? badgeDoc.name : (badgeEntry.badgeId || 'a badge');
              const badgeDesc = (badgeDoc && badgeDoc.description) ? badgeDoc.description : '';
              const backendBase = process.env.BACKEND_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || '3001'}`;
              const imageUrl = badgeDoc && badgeDoc.id ? `${backendBase}/api/badge/images/${badgeDoc.id}` : `${backendBase}/api/badge/images/${badgeEntry.badgeId}`;
              const certificateId = badgeEntry.certificateId || null;
              await sendBadgeReceivedEmail(updateOp.updateOne.filter.email, badgeName, badgeDesc, null, certificateId, imageUrl);
              console.log(`Badge received email sent to ${updateOp.updateOne.filter.email} for ${badgeName}`);
            } catch (emailError) {
              console.error(`Failed to send badge email to ${updateOp.updateOne.filter.email} for badge ${badgeEntry.badgeId}:`, emailError);
            }
          }
        } catch (err) {
          console.error('Error while sending badge emails for updates:', err);
        }
      }
    }

    jobStatusDoc.importedUsers = [
      ...jobStatusDoc.result.validUsers,
      ...jobStatusDoc.result.invalidUsers
    ]

    jobStatusDoc.result.validUsers = [];

    jobStatusDoc.result.invalidUsers = [];

    await jobStatusDoc.save();
    return res.status(200).json({result: jobStatusDoc.importedUsers});
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
