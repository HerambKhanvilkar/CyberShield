require('dotenv').config();
const mongoose = require('mongoose');
const Badge = require('./models/Badge');

// Initial badge data with images stored in the public/images folder
const initialBadges = [
  { 
    id: 1, 
    name: "Cyber Titan Level I", 
    image: "/images/img1.png",  // Path relative to public folder
    difficulty: "Easy", 
    description: "Awarded for completing basic cybersecurity challenges.",
    category: "Amateur",
    skillsEarned: ["Basic Security", "Web Awareness"]
  },
  { 
    id: 2, 
    name: "Cyber Warrior", 
    image: "/images/img2.png", 
    difficulty: "Medium", 
    description: "Earned after passing the second level of security defenses.",
    category: "Intermediate",
    skillsEarned: ["Network Security", "Threat Identification"]
  },
  { 
    id: 3, 
    name: "Cyber Defender", 
    image: "/images/img3.jpg", 
    difficulty: "Medium", 
    description: "Awarded for identifying and mitigating cyber threats.",
    category: "Intermediate",
    skillsEarned: ["Threat Prevention", "Security Policy"]
  },
  { 
    id: 4, 
    name: "Cyber Elite", 
    image: "/images/img4.jpg", 
    difficulty: "Hard", 
    description: "For advanced penetration testing and security analysis.",
    category: "Professional",
    skillsEarned: ["Penetration Testing", "Vulnerability Assessment"]
  },
  { 
    id: 5, 
    name: "Cyber Guardian", 
    image: "/images/img5.png", 
    difficulty: "Expert", 
    description: "Given to experts in cybersecurity incident response.",
    category: "Professional",
    skillsEarned: ["Incident Response", "Forensic Analysis"]
  },
  { 
    id: 6, 
    name: "Cyber Commander", 
    image: "/images/img6.png", 
    difficulty: "Expert", 
    description: "Achieved by mastering network security and ethical hacking.",
    category: "Expert",
    skillsEarned: ["Strategic Planning", "Team Leadership"]
  },
  { 
    id: 7, 
    name: "Cyber Legend", 
    image: "/images/img7.png", 
    difficulty: "Extreme", 
    description: "Reserved for elite professionals in cybersecurity.",
    category: "Expert",
    skillsEarned: ["Advanced Techniques", "Innovative Solutions"]
  },
  { 
    id: 8, 
    name: "Cyber Master", 
    image: "/images/img8.png", 
    difficulty: "Extreme", 
    description: "Top-tier badge awarded for cybersecurity mastery.",
    category: "Expert",
    skillsEarned: ["Complete Expertise", "Industry Leadership"]
  }
];

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
    
    mongoose.disconnect();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.disconnect();
  }
})
.catch(err => {
  console.error("MongoDB Connection Error:", err);
});