require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

// Get username from command line
const username = process.argv[2];

if (!username) {
  console.error("Please provide a username!");
  console.log("Usage: node makeAdmin.js <username>");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB Connected");
    
    try {
      // Find the user
      const user = await User.findOne({ username });
      
      if (!user) {
        console.error(`User "${username}" not found!`);
        mongoose.disconnect();
        return;
      }
      
      // Update to admin
      user.isAdmin = true;
      await user.save();
      
      console.log(`User "${username}" is now an admin!`);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
  });