require("dotenv").config();
const jwt = require('jsonwebtoken');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

// Import models from the models directory
const User = require("./models/User");
const Badge = require("./models/Badge");
const BadgesEarned = require("./models/BadgesEarned");

const app = express();
app.use(express.json());
app.use(cors());

const { generateToken, authenticateJWT, isAdmin } = require('./middleware/auth');

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


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Get all badges
app.get("/api/badges", async (req, res) => {
  try {
    const badges = await Badge.find({});
    res.json({ badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get single badge by ID
app.get("/api/badge/:id", async (req, res) => {
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
app.get("/api/verify-badge/:id/:username/:timestamp", async (req, res) => {
  try {
    const { id, username, timestamp } = req.params;
    
    // Check if the badge was actually earned by this user
    const userBadges = await Users.findById(username);
    
    if (!userBadges) {
      return res.status(404).json({ verified: false });
    }
    
    // Check if user has this specific badge
    const badgeEarned = userBadges.badges.find(
      b => b.badgeId === parseInt(id)
    );
    
    if (!badgeEarned) {
      return res.status(403).json({ verified: false });
    }
    
    // Optional: Add timestamp validation 
    const currentTime = Math.floor(Date.now() / 1000);
    const linkAge = currentTime - parseInt(timestamp);
    
    // Invalidate links older than 30 days
    if (linkAge > 30 * 24 * 60 * 60) {
      return res.status(410).json({ verified: false });
    }
    
    res.json({ verified: true });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ verified: false });
  }
});

// Generate share link endpoint
app.post("/api/generate-share-link", authenticateJWT, async (req, res) => {
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


// Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    // Check if email or username already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists! Please log in." });
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

    // Generate JWT token
    const token = generateToken(newUser);

    res.json({ 
      message: "Signup successful!", 
      token, // Send token to client
      user: { 
        username: newUser.id, 
        firstName: newUser.firstName, 
        email: newUser.email 
      } 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Login Route (Accepts email or username)
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    // Generate JWT token
    const token = generateToken(user);

    // Fetch earned badges
    const userBadges = await BadgesEarned.findOne({ username: user.username }).lean();
    const allBadges = userBadges
      ? await Badge.find({ id: { $in: userBadges.badges.map(b => b.badgeId) } })
      : [];

    // Map earned badges with dates
    const earnedBadges = allBadges.map(badge => ({
      ...badge.toObject(),
      earnedDate: userBadges?.badges.find(b => b.badgeId === badge.id)?.earnedDate
    }));

    res.json({
      message: "Login Successful!",
      token, // Send token to client
      user: {
        username: user.id,
        firstName: user.firstName,
        email: user.email,
        isAdmin: user.isAdmin,
        badges: earnedBadges,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Badges Earned by User
app.get("/api/badges-earned", authenticateJWT, async (req, res) => {
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
app.get("/api/user", authenticateJWT, async (req, res) => {
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
app.post("/api/assign-badge",authenticateJWT, async (req, res) => {
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
    const hasBadge = user.badges.some(b => b.badgeId === badgeId);

    if (hasBadge) {
      return res.status(400).json({ message: "User already has this badge" });
    }

    // Add badge to existing record
    user.badges.push({ badgeId, earnedDate: new Date() });
    await user.save();
    
    res.json({ message: "Badge assigned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Check admin status
app.get("/api/check-admin",authenticateJWT, async (req, res) => {
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
app.get("/api/users", authenticateJWT, async (req, res) => {
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

    const users = await User.find({isAdmin: false});
    
    res.json(users.map( (user) => {
      return { 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    }));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Users autocomplete
app.get("/api/users/autocomplete", authenticateJWT, async (req, res) => {
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

    const users = await User.find({isAdmin: false, email: { "$regex": normalizedQuery} });

    const sortedUsers = users.sort(
      (a, b) => a.email.length - b.email.length
    );

    res.json(sortedUsers.map( (user) => {
      return { 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    }));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Users info edit
app.post("/api/user/info", authenticateJWT, async (req, res) => {
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

    const { email, newFirstName, newLastName, newPassword } = req.body;

    const filter = { email };
    const update = {};
    if (newFirstName){
      update["firstName"] = newFirstName;
    }
    if (newLastName){
      update["lastName"] = newLastName;
    }
    if (newPassword){
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      update["password"] = hashedPassword;
    }

    console.log(filter);
    console.log(update);
    const user = await User.findOneAndUpdate(filter, update);

    await user.save();
    
    res.json({ message: "User Info Updated Successfully." });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Assign badge to user
app.post("/api/revoke-badge",authenticateJWT, async (req, res) => {
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
    const hasBadge = user.badges.some(b => b.badgeId === badgeId);

    if (!hasBadge) {
      return res.status(400).json({ message: "Badge is not assigned to user" });
    }

    // Remove an badge with a specific id
    const index = user.badges.findIndex(b => b.badgeId === badgeId);
    if (index !== -1) {
      user.badges.splice(index, 1);
    }
    await user.save();
    
    res.json({ message: "Badge revoked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
