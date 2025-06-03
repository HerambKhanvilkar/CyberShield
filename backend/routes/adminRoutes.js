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

// const { validateMIMEType } = require("validate-image-type");

const upload = multer({ dest: 'uploads/' });

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



router.put("/badge/import", authenticateJWT, upload.single('image'), async (req, res) => {
  try {

    const { id, name, desc, level, vertical, skillsEarned } = req.body;
    var existingBadge = null;
    var existingBadgeImage = null;
    if (!id){
      return res.status(401).json({ message: "Badge Id required" });
    }
    existingBadge = await Badge.findOne({id});
    existingBadgeImage = await BadgeImage.findOne({id});

    if (!existingBadge){
      return res.status(401).json({ message: "Badge yet to be created" });
    }


    if (skillsEarned && skillsEarned !== []) { existingBadge["skillsEarned"] = skillsEarned } 
    if (vertical) { existingBadge["vertical"] = vertical } 
    if (level) { existingBadge["level"] = level } 
    if (desc) { existingBadge["desc"] = desc } 
    if (name) { existingBadge["name"] = name } 

    if (req.file){
      const badgeImageObj = {
        id: req.body.id,
        name: req.body.name || existingBadge["name"],
        image:  fs.readFileSync(path.join(__dirname, '../uploads/', req.file.filename)),
        contentType: req.file.mimetype // Use the uploaded file's mimetype
      };

      if (!existingBadgeImage){
        existingBadgeImage =  new BadgeImage(badgeImageObj);
      } else {
        existingBadgeImage["image"] = fs.readFileSync(
          path.join(__dirname, '../uploads/', req.file.filename)
        );
        existingBadge["contentType"]= req.file.mimetype;
      }
    console.log('badeImageObj', badgeImageObj);
    }

    

    existingBadge.save();
    existingBadgeImage.save();
    res.status(200).json({ message: 'Badge Modified successfully', data: existingBadge });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
  });


// upload badge
router.post("/badge/import", authenticateJWT, upload.single('image'), async (req, res) => {
// router.post("/admin/badge/import", authenticateJWT, async (req, res) => {
  try {
    console.log("TOP", req.body);
    const { id, name, desc, level, vertical, skillsEarned } = req.body;
    if ( !id || !name || !desc || !level || !vertical || !skillsEarned ){
      return res.status(401).json({ message: "Missing Fields!" });
    }
    const badgeExist = await Badge.findOne({id});
    const badgeImageExist = await BadgeImage.findOne({id});

    if (badgeExist){
      return res.status(401).json({ message: "Badge already exists" });
    }

    if (badgeImageExist){
      return res.status(401).json({ message: "Badge Image already exists" });
    }

    console.log(req.body);
    console.log(req.file);
    const badgeObj = {
        id: req.body.id,
        name: req.body.name,
        description: req.body.desc,
        level: req.body.level,
        vertical: req.body.vertical,
        skillsEarned: req.body.skillsEarned,
        image: ``,
    };

    const badgeImageObj = {
      id: req.body.id,
      name: req.body.name,
      image:  fs.readFileSync(path.join(__dirname, '../uploads/', req.file.filename)),
      contentType: req.file.mimetype // Use the uploaded file's mimetype
    };

    const newBadge = new Badge(badgeObj);
    const newBadgeImage = new BadgeImage(badgeImageObj);

    newBadge.save();
    newBadgeImage.save();
    res.status(200).json({ message: 'Badge created successfully', data: newBadge });

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
router.post("/users/import/preview", authenticateJWT, upload.single('file'), async (req, res) => {
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
    
    const hashedPassword = await bcrypt.hash('Pass@123', 10);

    const usersToBeInserted = jobStatusDoc.result.validUsers.map(u => {
      const badges = (JSON.parse("[" + u.badgeIds + "]")).map(b => {
        return { badgeId: b, earnedDate: new Date() }
      });

      return {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        badges: badges,
        password: hashedPassword
      };
    });

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
      await User.insertMany(usersToBeInserted);
      console.log("insert");
    }
    if ( usersToBeUpdated.length > 0){
      await User.bulkWrite(usersToBeInserted);
      console.log("update");
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
