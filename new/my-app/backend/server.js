require("dotenv").config();
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



// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Get all badges
app.get("/badges", async (req, res) => {
  try {
    const badges = await Badge.find({});
    res.json({ badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get single badge by ID
app.get("/badge/:id", async (req, res) => {
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
app.get("/verify-badge/:id/:username/:timestamp", async (req, res) => {
  try {
    const { id, username, timestamp } = req.params;
    
    // Check if the badge was actually earned by this user
    const userBadges = await BadgesEarned.findOne({ username });
    
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
app.post("/generate-share-link", authenticateJWT, async (req, res) => {
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
app.post("/signup", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists! Please log in." });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({ 
      email, 
      username, 
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
        username: newUser.username, 
        email: newUser.email 
      } 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Login Route (Accepts email or username)
app.post("/login", async (req, res) => {
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
        username: user.username,
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
app.get("/badges-earned/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Fetch earned badges
    const userBadges = await BadgesEarned.findOne({ username }).lean();
    
    if (!userBadges) {
      return res.json({ badges: [] });
    }

    // Fetch full badge details for each earned badge
    const badgeIds = userBadges.badges.map(b => b.badgeId);
    
    const allBadges = await Badge.find({ id: { $in: badgeIds } }).lean();

    // Map earned badges with dates
    const earnedBadges = allBadges.map(badge => ({
      ...badge,
      earnedDate: userBadges.badges.find(b => b.badgeId === badge.id)?.earnedDate
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
app.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("-password");
    
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
app.post("/assign-badge",authenticateJWT, async (req, res) => {
  try {
    const { username, badgeId, adminUsername } = req.body;
    
    // Check if admin user exists and is actually an admin
    const adminUser = await User.findOne({ username: adminUsername });
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if badge exists
    const badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }
    
    // Check if user already has badge record
    let userBadges = await BadgesEarned.findOne({ username });
    
    if (userBadges) {
      // Check if user already has this badge
      const hasBadge = userBadges.badges.some(b => b.badgeId === badgeId);
      
      if (hasBadge) {
        return res.status(400).json({ message: "User already has this badge" });
      }
      
      // Add badge to existing record
      userBadges.badges.push({ badgeId, earnedDate: new Date() });
      await userBadges.save();
    } else {
      // Create new badges earned record
      userBadges = new BadgesEarned({
        username,
        badges: [{ badgeId, earnedDate: new Date() }]
      });
      await userBadges.save();
    }
    
    res.json({ message: "Badge assigned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Check admin status
app.get("/check-admin",authenticateJWT, async (req, res) => {
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));