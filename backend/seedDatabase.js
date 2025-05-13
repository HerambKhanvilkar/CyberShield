require('dotenv').config();
const mongoose = require('mongoose');
const Badge = require('./models/Badge');
const User = require('./models/User');
const bcrypt = require("bcrypt");

// Initial badge data with images stored in the public/images folder
const initialBadges = [
  // { 
  //   id: 1, 
  //   name: "Cyber Titan Level I", 
  //   image: "/images/img1.png",  // Path relative to public folder
  //   difficulty: "Easy", 
  //   description: "Awarded for completing basic cybersecurity challenges.",
  //   category: "Amateur",
  //   skillsEarned: ["Basic Security", "Web Awareness"]
  // },
  { 
    id: 2, 
    name: "Cyber Warrior", 
    image: "/images/img2.png", 
    difficulty: "Medium", 
    description: "Earned after passing the second level of security defenses.",
    level: "Intermediate",
    vertical: "Information Security",
    skillsEarned: ["Network Security", "Threat Identification"]
  },
  // { 
  //   id: 3, 
  //   name: "Cyber Defender", 
  //   image: "/images/img3.jpg", 
  //   difficulty: "Medium", 
  //   description: "Awarded for identifying and mitigating cyber threats.",
  //   category: "Intermediate",
  //   skillsEarned: ["Threat Prevention", "Security Policy"]
  // },
  // { 
  //   id: 4, 
  //   name: "Cyber Elite", 
  //   image: "/images/img4.jpg", 
  //   difficulty: "Hard", 
  //   description: "For advanced penetration testing and security analysis.",
  //   category: "Professional",
  //   skillsEarned: ["Penetration Testing", "Vulnerability Assessment"]
  // },
  { 
    id: 5, 
    name: "Cyber Guardian", 
    image: "/images/img5.png", 
    difficulty: "Expert", 
    description: "Given to experts in cybersecurity incident response.",
    level: "Professional",
    vertical: "Incident Response and Management",
    skillsEarned: ["Incident Response", "Forensic Analysis"]
  },
  { 
    id: 6, 
    name: "Cyber Commander", 
    image: "/images/img6.png", 
    difficulty: "Expert", 
    description: "Achieved by mastering network security and ethical hacking.",
    level: "Professional",
    vertical: "Cybersecurity",
    skillsEarned: ["Strategic Planning", "Team Leadership"]
  },
  // { 
  //   id: 7, 
  //   name: "Cyber Legend", 
  //   image: "/images/img7.png", 
  //   difficulty: "Extreme", 
  //   description: "Reserved for elite professionals in cybersecurity.",
  //   category: "Expert",
  //   skillsEarned: ["Advanced Techniques", "Innovative Solutions"]
  // },
  { 
    id: 8, 
    name: "Cyber Master", 
    image: "/images/img8.png", 
    difficulty: "Extreme", 
    description: "Top-tier badge awarded for cybersecurity mastery.",
    level: "Professional",
    vertical: "Cybersecurity Professional Development",
    skillsEarned: ["Complete Expertise", "Industry Leadership"]
  }
];

const newUsers = [
    {
        "firstName":"Agastya",
        "lastName":"Sakhare",
        "email":"agastyasakhare4040@gmail.com",
    },
    {
        "firstName":"Mohit",
        "lastName":"Dewani",
        "email":"mohit16dpga0305@student.mes.ac.in",
    },
    {
        "firstName":"Siddharth",
        "lastName":"Nair",
        "email":"siddharth16dpga0115@student.mes.ac.in",
    },
    {
        "firstName":"Riya",
        "lastName":"Rattish",
        "email":"riya17dpga0005@student.mes.ac.in",
    },
    {
        "firstName":"Srushti",
        "lastName":"Jadhav",
        "email":"srushti17dpga0074@student.mes.ac.in",
    },
    {
        "firstName":"Vaishnavi",
        "lastName":"Konar",
        "email":"24dpga0064@student.mes.ac.in",
    },
    {
        "firstName":"Shaurya",
        "lastName":"Shettigar",
        "email":"22dpga0046@student.mes.ac.in",
    }
];

const insertUser = async ({firstName, lastName, email}) => {
  try {

    const password = 'Pass@123';
    // Check if email or username already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log({ message: `User already exists! ${email}` });
      return 0;
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

    console.log({message: "Signup successful!"});
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  console.log("MongoDB Connected");
  
  try {
    // Clear existing badges
    await Badge.deleteMany({});
    console.log("Cleared existing badges");
    
    // Insert new badges
    const result = await Badge.insertMany(initialBadges);
    console.log(`Added ${result.length} badges to the database`);
    
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  try {
    // Insert new badges
    for ( i of newUsers) 
    {
      await insertUser(i);
    }
    
    mongoose.disconnect();
    console.log("Database updated with all new users successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.disconnect();
  }
})
.catch(err => {
  console.error("MongoDB Connection Error:", err);
});
