const jwt = require('jsonwebtoken');
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
// Set up multer for file uploads
const upload = multer({ dest: '../uploads/' });
// Import models from the models directory
const User = require("../models/User");
const Badge = require("../models/Badge");
const BadgeImage = require("../models/BadgeImage");
const BadgesEarned = require("../models/BadgesEarned");
const { generateToken, authenticateJWT, isAdmin } = require('../middleware/auth');

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


// Get all badges
router.get("/badges", async (req, res) => {
  try {
    const badges = await Badge.find({});
    res.json({ badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint to get badge images
router.get("/badge/images/:id", async (req, res) => {
    try {
        const badgeImage = await BadgeImage.findOne({ id: req.params.id });
        if (!badgeImage) {
            return res.status(404).json({ message: "Image not found" });
        }
        res.set('Content-Type', badgeImage.image.contentType);
        res.send(badgeImage.image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Get single badge by ID
router.get("/badge/:id", async (req, res) => {
  try {
    const badge = await Badge.findOne({ id: parseInt(req.params.id) });
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }
    res.json(badge);
  } catch (error) {
    console.error("Error fetching badge:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verify shared badge
router.get("/verify-badge/:id/:username/:timestamp", async (req, res) => {
  try {
    const { id, username, timestamp } = req.params;
    
    // Check if the badge was actually earned by this user
    const user = await User.findById(username);
    
    if (user.badges === []) {
      return res.status(404).json({ verified: false });
    }
    
    // Check if user has this specific badge
    const badgeEarned = user.badges.find(
      b => b.badgeId == id
    );
    
    if (!badgeEarned) {
      return res.status(403).json({ verified: false });
    }
    
    // Optional: Add timestamp validation 
    // const currentTime = Math.floor(Date.now() / 1000);
    // const linkAge = currentTime - parseInt(timestamp);
    
    // Invalidate links older than 30 days
    // if (linkAge > 30 * 24 * 60 * 60) {
    //   return res.status(410).json({ verified: false });
    // }
    
    res.json({ verified: true , firstName: user.firstName, lastName: user.lastName});
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ verified: false });
  }
});

// Generate share link endpoint
router.post("/generate-share-link", authenticateJWT, async (req, res) => {
  try {
    const { badgeId } = req.body;
    const username = req.headers.username;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!badgeId) {
      return res.status(400).json({ message: "Badge ID is required" });
    }
    
    // Fetch earned badges
    const userBadges = await BadgesEarned.findOne({ username }).lean();
    
    if (!userBadges) {
      return res.status(403).json({ message: "No badges found for user" });
    }
    
    // Check if user has this badge
    const hasBadge = userBadges.badges.some(badge => badge.badgeId === parseInt(badgeId));
    
    if (!hasBadge) {
      return res.status(403).json({ message: "You can only share badges you've earned" });
    }
    
    // Generate timestamp for the link
    const timestamp = Math.floor(Date.now()/1000);
    
    // Generate share link
    const shareLink = `/badge/shared/${badgeId}/${encodeURIComponent(username)}/${timestamp}`;
    
    res.json({ shareLink });
  } catch (error) {
    console.error("Error generating share link:", error);
    res.status(500).json({ message: "Failed to generate share link" });
  }
});


// Get Badges Earned by User
router.get("/badges-earned", authenticateJWT, async (req, res) => {
  try {

    const authHeader = req.headers.authorization;
    const email = await getUsername(authHeader);

    // Fetch earned badges
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.badges === []) {
      return res.json({ badges: [] });
    }

    // Fetch full badge details for each earned badge
    const badgeIds = user.badges.map(b => b.badgeId);
    
    const allBadges = await Badge.find({ id: { $in: badgeIds } }).lean();

    // Map earned badges with dates
    const earnedBadges = allBadges.map(badge => ({
      ...badge,
      earnedDate: user.badges.find(b => b.badgeId === badge.id)?.earnedDate
    }));

    res.json({ badges: earnedBadges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ 
      message: "Error loading badges", 
      error: error.message 
    });
  }
});

// Get user details
router.get("/user", authenticateJWT, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const email = await getUsername(authHeader);
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Assign badge to user
router.post("/assign-badge", authenticateJWT, async (req, res) => {
  try {
    const { email, badgeId } = req.body;

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
    
    // Check if badge exists
    const badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }
    
    // Check if user already has this badge
    const hasBadge = user.badges.some(b => b.badgeId == badgeId);

    if (hasBadge) {
      return res.status(400).json({ message: "User already has this badge" });
    }

    // Add badge to existing record
    user.badges.push({ badgeId, earnedDate: new Date() });
    await user.save();
    
    res.json({ 
      message: "Badge assigned successfully", 
      user: {
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        badges: user.badges
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Check admin status
router.get("/check-admin",authenticateJWT, async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ isAdmin: false });
    }
    
    res.json({ isAdmin: user.isAdmin || false });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get user details
router.get("/users", authenticateJWT, async (req, res) => {
  try {
    // dummy approach, as the variable is modifiable
    const { email } = req.query || null;

    const authHeader = req.headers.authorization;

    const adminUsername = await getUsername(authHeader);

    if (!adminUsername) {
      return res.status(403).json({ message: "Logged in user not found." });
    }

    // Check if admin user exists and is actually an admin
    const adminUser = await User.findOne({ email: adminUsername});

    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const filter = {};

    filter["isAdmin"] = false;

      // console.log("email", email);
    if (email){
      filter["email"] = email;
    }

    const users = await User.find(filter);
    
    res.json(users.map( (user) => {
      return { 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        badges: user.badges,
      }
    }));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Users autocomplete
router.get("/users/autocomplete", async (req, res) => {
  try {
    // dummy approach, as the variable is modifiable
    // const { adminUsername } = req.body;

    const authHeader = req.headers.authorization;

    const adminUsername = await getUsername(authHeader);

    if (!adminUsername) {
      return res.status(403).json({ message: "Logged in user not found." });
    }

    // Check if admin user exists and is actually an admin
    const adminUser = await User.findOne({ email: adminUsername});

    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const query = req.query.q || "";

    const normalizedQuery = query.replace(/\s+/g, "").toLowerCase();

    const users = await User.find({
      isAdmin: false, 
      $or: [
        { email: new RegExp(normalizedQuery, "i")},
        { firstName: new RegExp(normalizedQuery, "i")},
        { lastName: new RegExp(normalizedQuery, "i")},
      ]
      });

    const sortedUsers = users.sort(
      (a, b) => a.email.length - b.email.length
    );

    res.json(sortedUsers.map( (user) => {
      return { 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        badges: user.badges,
      }
    }));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Users info edit
router.post("/user/info", authenticateJWT, async (req, res) => {
  try {
    // dummy approach, as the variable is modifiable
    // const { adminUsername } = req.body;

    const authHeader = req.headers.authorization;

    const adminUsername = await getUsername(authHeader);

    if (!adminUsername) {
      return res.status(403).json({ message: "Logged in user not found." });
    }

    // Check if admin user exists and is actually an admin
    const adminUser = await User.findOne({ email: adminUsername});

    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { email, firstName, lastName, password } = req.body;

    if (!email){
      return res.status(402).json({ message: "No email found. Email required to perform action." });
    }
    const filter = { email };
    const update = {};
    if (firstName){
      update["firstName"] = firstName;
    }
    if (lastName){
      update["lastName"] = lastName;
    }
    if (password){
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      update["password"] = hashedPassword;
    }

    // console.log(filter);
    const user = await User.findOneAndUpdate(filter, update, { returnDocument:'after'});

    await user.save();
    // console.log("updated user", user);
    
    res.json({ 
      message: "User Info Updated Successfully.",
      user: {
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        badges: user.badges
      } 
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Assign badge to user
router.post("/revoke-badge", authenticateJWT, async (req, res) => {
  try {
    const { email, badgeId } = req.body;

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
    
    // Check if badge exists
    const badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }
    
    // Check if user already has this badge
    const hasBadge = user.badges.some((b) => b.badgeId == badgeId);
    user.badges.forEach(b => { 
      // console.log("users.badges", b.badgeId);
    })

    if (!hasBadge) {
      return res.status(400).json({ message: "Badge is not assigned to user" });
    }

    // Remove an badge with a specific id
    const index = user.badges.findIndex(b => b.badgeId == badgeId);
    // console.log("index", index);
    if (index !== -1) {
      user.badges.splice(index, 1);
    }
    await user.save();
    // console.log("after");
    user.badges.forEach(b => { 
      // console.log("users.badges", b.badgeId);
    })
    
    res.json({ message: "Badge revoked successfully", 
      user: {
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        badges: user.badges
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route for downloading a dummy data sample CSV
router.get('/users/sample', authenticateJWT, async (req, res) => {
  // Create dummy data
  const sampleData = [
    { _id: '1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', badgeIds: [101, 102].toString() },
    { _id: '2', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', badgeIds: [101].toString() },
    { _id: '3', email: 'user3@example.com', firstName: 'Alice', lastName: 'Johnson', badgeIds: [104, 111].toString() },
  ];

  // Convert JSON to CSV
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(sampleData);

  // Set the filename and content type
  const fileName = 'sample_data.csv';
  res.header('Content-Type', 'text/csv');
  res.attachment(fileName);
  res.send(csv);
});


module.exports = router;
