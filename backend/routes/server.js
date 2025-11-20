const jwt = require('jsonwebtoken');
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { 
  sendBadgeReceivedEmail,
  sendProfileUpdateEmail 
} = require("../services/emailService");
// Set up multer for image Preview
const uploadPreviewImage = multer({
  limits: { fileSize: 5 * 1000 * 1000 }, // 5MB max file size
  fileFilter: function(req, file, callback) {
    let fileExtension = (file.originalname.split('.')[file.originalname.split('.').length-1]).toLowerCase(); // convert extension to lower case
    if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
      return callback('Wrong file type', false);
    }
    file.extension = fileExtension.replace(/jpeg/i, 'jpg'); // all jpeg images to end .jpg
    callback(null, true);
  },
  dest: 'previews/' 
});

// Profile update
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
  dest: 'users/' 
});

// Import models from the models directory
const User = require("../models/User");
const Badge = require("../models/Badge");
const BadgeImage = require("../models/BadgeImage");
const UserImage = require("../models/UserImage");
const BadgesEarned = require("../models/BadgesEarned");
const { generateToken, authenticateJWT, isAdmin } = require('../middleware/auth');

const getUsername = async (authHeader) => {
  if(!authHeader){
    console.log('No auth Header');
    return null;
  }
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
      if (!req.params.id) 
        return res.status(404).json({ message: "Image not found" });
    // Ensure numeric id lookup when IDs are stored as numbers
    const lookupId = isNaN(parseInt(req.params.id)) ? req.params.id : parseInt(req.params.id);
    const badgeImage = await BadgeImage.findOne({ id: lookupId });
    if (!badgeImage || !badgeImage.image) {
      return res.status(404).json({ message: "Image not found" });
    }
    // BadgeImage model stores contentType in its own field
    const contentType = badgeImage.contentType || 'application/octet-stream';
    res.set('Content-Type', contentType);
    res.send(badgeImage.image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Endpoint to get badge earners
router.get("/badge/earners/:id", async (req, res) => {
    try {
      if (!req.params.id) 
        return res.status(404).json({ message: "Badge not found" });
        const earners = await User.countDocuments({ 'badges.badgeId': req.params.id });
        if (!earners) {
            return res.status(404).json({ message: "Badge not found" });
        }
      res.json({earners});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Get single badge by ID
router.get("/badge/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // Try find by badgeId (string) first, then numeric id
    let badge = await Badge.findOne({ badgeId: id });
    if (!badge && !isNaN(parseInt(id))) {
      badge = await Badge.findOne({ id: parseInt(id) });
    }

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
    
    // Support either _id or email passed as "username". Try _id first, otherwise email.
    let user = null;
    try {
      // try treat username as ObjectId
      user = await User.findById(username).lean();
    } catch (e) {
      user = null;
    }

    if (!user) {
      const decodedUsername = decodeURIComponent(username);
      user = await User.findOne({ email: decodedUsername }).lean();
    }

    if (!user || !Array.isArray(user.badges) || user.badges.length === 0) {
      return res.status(404).json({ verified: false });
    }

    // Check if user has this specific badge (support numeric id or badgeId string)
    const badgeEarned = user.badges.find(
      b => (String(b.badgeId) === String(id) && b.isPublic === true)
    );

    if (!badgeEarned) {
      return res.status(403).json({ verified: false });
    }

    // Return the certificateId (if present) to show on share page
    res.json({ verified: true, firstName: user.firstName, lastName: user.lastName, certificateId: badgeEarned.certificateId || null });
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
    
    // Fetch earned badges from User record
    const user = await User.findOne({ email: username }).lean();

    if (!user || !Array.isArray(user.badges)) {
      return res.status(403).json({ message: "No badges found for user" });
    }

    // Check if user has this badge (badgeId is string)
    const hasBadge = user.badges.some(badge => String(badge.badgeId) === String(badgeId));

    if (!hasBadge) {
      return res.status(403).json({ message: "You can only share badges you've earned" });
    }
    
    // Generate timestamp for the link
    const timestamp = Math.floor(Date.now()/1000);
    
    // Generate share link (use badgeId string)
    const shareLink = `/badge/shared/${encodeURIComponent(badgeId)}/${encodeURIComponent(username)}/${timestamp}`;
    
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
    
    if (user.badges.lenght === 0) {
      return res.json({ badges: [] });
    }

    // Fetch full badge details for each earned badge
    const badgeIds = user.badges.map(b => b.badgeId);
    // Separate numeric ids and string badgeIds
    const numericIds = badgeIds.map(id => parseInt(id)).filter(n => !isNaN(n));
    const stringIds = badgeIds.filter(id => isNaN(parseInt(id)));

    const query = { $or: [] };
    if (stringIds.length > 0) query.$or.push({ badgeId: { $in: stringIds } });
    if (numericIds.length > 0) query.$or.push({ id: { $in: numericIds } });

    const allBadges = query.$or.length > 0 ? await Badge.find(query).lean() : [];

    // Map earned badges with dates (match by badgeId string or numeric id)
    const earnedBadges = allBadges.map(badge => ({
      ...badge,
      earnedDate: user.badges.find(b => String(b.badgeId) === String(badge.badgeId) || String(b.badgeId) === String(badge.id))?.earnedDate
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
    // Support badge lookup by numeric id or string badgeId
    let badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      badge = await Badge.findOne({ badgeId: String(badgeId) });
    }
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }
    
    // Check if user already has this badge
    const hasBadge = user.badges.some(b => b.badgeId == badgeId);

    if (hasBadge) {
      return res.status(400).json({ message: "User already has this badge" });
    }

    // Generate a unique certificate ID for this issuance by incrementing badge.certificateCounter
    const updatedBadge = await Badge.findOneAndUpdate(
      { _id: badge._id },
      { $inc: { certificateCounter: 1 } },
      { new: true }
    );

    const counter = updatedBadge.certificateCounter || 1;
    const seq = String(counter).padStart(3, '0');
    // Use badge.badgeId if present, otherwise construct from badge.name + id fallback
    const baseBadgeId = updatedBadge.badgeId || (String(updatedBadge.id).padStart(6, '0'));
    const certificateId = `${baseBadgeId}${seq}`;

    // Add badge to existing record with certificateId and store badgeId string
    user.badges.push({ badgeId: updatedBadge.badgeId || String(updatedBadge.id), earnedDate: new Date(), certificateId });
    await user.save();
    
    // Send badge received email notification (include certificateId and badge image URL)
    try {
      const backendBase = process.env.BACKEND_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || '3001'}`;
      const imageUrl = updatedBadge && updatedBadge.id ? `${backendBase}/api/badge/images/${updatedBadge.id}` : `${backendBase}/api/badge/images/${badge.badgeId || badge.id}`;
      // Respect user's email preferences (default to true)
      const prefs = user.emailPreferences || {};
      if (prefs.badgeReceived !== false) {
        await sendBadgeReceivedEmail(
          user.email,
          badge.name,
          badge.description || 'Congratulations on earning this achievement!',
          null,
          certificateId,
          imageUrl
        );
        console.log(`Badge notification email sent to ${user.email}`);
      } else {
        console.log(`Skipping badge email for ${user.email} due to preferences`);
      }
    } catch (emailError) {
      console.error(`Failed to send badge notification email to ${user.email}:`, emailError);
      // Don't fail the request if email fails
    }
    
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

    console.log(email);

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

    const users = await User.find(filter).select("-_id");
    
    res.status(200).json(users);

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
    
    // Support numeric id or string badgeId for lookup
    let badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      badge = await Badge.findOne({ badgeId: String(badgeId) });
    }
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
    const index = user.badges.findIndex(b => String(b.badgeId) == String(badgeId));
    // console.log("index", index);
    if (index !== -1) {
      user.badges.splice(index, 1);
    }
    await user.save();
    // console.log("after");
    user.badges.forEach(b => { 
      // console.log("users.badges", b.badgeId);
    })
    
    // Send badge revocation email notification
    try {
      // Respect user's profileUpdate preference (default true)
      const prefs = user.emailPreferences || {};
      if (prefs.profileUpdate !== false) {
        await sendProfileUpdateEmail(
          user.email,
          'badge_stripped',
          badge.name,
          '<p style="margin-top: 10px;">If you believe this was done in error, please contact support.</p>'
        );
        console.log(`Badge revocation email sent to ${user.email}`);
      } else {
        console.log(`Skipping profile/update email for ${user.email} due to preferences`);
      }
    } catch (emailError) {
      console.error(`Failed to send badge revocation email to ${user.email}:`, emailError);
      // Don't fail the request if email fails
    }
    
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
    { _id: '1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', badgeIds: ['CA000100','CA000101'].toString() },
    { _id: '2', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', badgeIds: ['CA000100'].toString() },
    { _id: '3', email: 'user3@example.com', firstName: 'Alice', lastName: 'Johnson', badgeIds: ['CA000104','CA000111'].toString() },
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

// Route for updating profile info.
router.put('/user/profile', authenticateJWT, uploadImage.single('profileImage'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const email = await getUsername(authHeader);
    const user = await User.findOne({ email });
    var userImage = await UserImage.findOne({email});
    var imageData = null;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { firstName, lastName, password, newPassword, badges, emailPreferences }  = req.body;

    // Allow updating emailPreferences alone, or any of the other profile fields
    if (!firstName && !lastName && !password && !req.file && !badges && !emailPreferences) {
      return res.status(404).json({ message: "No data sent for Update. Try again." });
    }

    if(firstName) { user.firstName = firstName }
    if(lastName) { user.lastName = lastName }
    if(badges) { 
      console.log(badges);
      badges.forEach(b => console.log(b))
      user.badges = user.badges.map(b => {
      const formBadge = badges.find(f => f.badgeId == b.badgeId)
      if (formBadge === undefined){ return b }
      return { ...b, isPublic: formBadge.isPublic }
    })}
    if (password){
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch){
        console.log(new Date() + "Incorrect password during password update for user" + user.email);
        return res.status(404).json({ message: "Incorrect password." });
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    if (req.file){
      console.log("resizing...");

      const image = sharp(req.file.path);
      image.metadata() // get image metadata for size
        .then(async function(metadata) {
          if (metadata.width > 400 || metadata.height > 400) {
            return image.resize({ width: 400, height: 400 }).toBuffer(); // resize if too big
          } else {
            return image.toBuffer();
          }
        })
        .then(async function(data) { // upload to s3 storage
          const userImageObj = {
            id: user._id,
            email: user["email"],
            image: data,
            contentType: req.file.mimetype // Use the uploaded file's mimetype
          };

          if (!userImage){
            userImage =  new UserImage(userImageObj);
          } else {
            userImage["image"] = data;            
            userImage["contentType"]= req.file.mimetype;
          }
          console.log('userImageObj', userImageObj);
          await userImage.save();
        })
    }

    if (req.file) { user.set("image", "/user/profile/image/" + userImage._id); }
    // Update email preferences if provided
    if (emailPreferences) {
      try {
        const prefs = typeof emailPreferences === 'string' ? JSON.parse(emailPreferences) : emailPreferences;
        user.emailPreferences = user.emailPreferences || {};
        if (typeof prefs === 'object') {
          if (typeof prefs.badgeReceived !== 'undefined') user.emailPreferences.badgeReceived = !!prefs.badgeReceived;
          if (typeof prefs.profileUpdate !== 'undefined') user.emailPreferences.profileUpdate = !!prefs.profileUpdate;
          if (typeof prefs.adminDaily !== 'undefined') user.emailPreferences.adminDaily = !!prefs.adminDaily;
        }
      } catch (err) {
        console.warn('Invalid emailPreferences payload', err);
      }
    }
    await user.save();
    return res.status(200).json({ message: "Profile Updated successfully." });
  } catch (e) {
    console.log("Error during profile update", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }

});

router.post("/preview/image", authenticateJWT, uploadPreviewImage.single('image'), async (req, res) => {
    if (req.file){
      console.log("resizing...");

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
          res.set('Content-Type', req.file.mimetype);
          res.send(data);
        })
    }
});


// Endpoint to get badge images
router.get("/user/profile/image/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(404).json({ message: "Invalid identifier!" });
      }

      const userImage = await UserImage.findOne({  });
      if (!userImage) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.set('Content-Type', userImage.image.contentType);
      res.send(userImage.image);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
});




module.exports = router;
