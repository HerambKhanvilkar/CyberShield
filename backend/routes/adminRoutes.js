const express = require("express");
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const multer = require('multer');
// Set up multer for file uploads
// const upload = multer({ dest: '../uploads/' });
const fs = require('fs');
const path = require('path');
const Badge = require("../models/Badge");
const BadgeImage = require("../models/BadgeImage");
const User = require("../models/User");
const jwt = require('jsonwebtoken');

const getUsername = async (authHeader) => {
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findOne({
    _id: decoded.id,
  });

  if (!user) {
    return null
  }
  return user.email
}

// Middleware to set badge ID in req
router.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/badge/import') {
      console.log(req.body.id)
        req.badgeId = req.body.id; // Store badge ID in req.badgeId
    }
    next();
});


// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(req);
        cb(null, path.join(__dirname, '../badgeImages')); // Save images in badgeImages folder
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use original file name
    }
});
const upload = multer({ storage: storage });


// upload badge
router.post("/badge/import", authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const badgeId = req.body.id;
    const badgeExist = await Badge.findOne({id: badgeId });
    const badgeImageExist = await BadgeImage.findOne({id: badgeId });

    if (badgeExist){
      return res.status(401).json({ message: "Badge already exists" });
    }

    if (badgeImageExist){
      return res.status(401).json({ message: "Badge Image already exists" });
    }

    const badgeObj = {
        id: req.body.id,
        name: req.body.name,
        description: req.body.desc,
        level: req.body.level,
        vertical: req.body.vertical,
        skillsEarned: req.body.skillsEarned,
    };
      console.log("0001", badgeObj);
    const badgeImageObj = {
      id: req.body.id,
      name: req.body.name,
      image: fs.readFileSync(path.join(__dirname, '../badgeImages', req.file.originalname)), // Read image using badge ID as filename
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


module.exports = router;
