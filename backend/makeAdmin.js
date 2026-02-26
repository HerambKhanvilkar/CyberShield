require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address!");
  console.log("Usage: node makeAdmin.js <email>");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB Connected");
    
    try {
      // Find the user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.error(`User with email "${email}" not found!`);
        mongoose.disconnect();
        return;
      }
      
      // Update to admin
      user.isAdmin = true;
      await user.save();
      
      console.log(`User "${email}" (${user.firstName} ${user.lastName}) is now an admin!`);
      console.log(`isAdmin: ${user.isAdmin}`);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
  });