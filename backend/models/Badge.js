const mongoose = require('mongoose');

const imgSchema = new mongoose.Schema({
  data: { type: Buffer, required: true, },
  contentType: { type: String, default: 'image/png', required: true, }
},  { _id: false });

const BadgeSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'],
    default: 'Medium'
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Amateur', 'Intermediate', 'Professional'],
    required: true
  },
  vertical: {
    type: String,
    enum: ['Information Security', 'Incident Response and Management', 'Cybersecurity', 'Cybersecurity Professional Development'],
    required: true
  },
  skillsEarned: [{
    type: String
  }],
  img: imgSchema,
  createdAt: {
    type: Date,
    default: Date.now 
  }
});

module.exports = mongoose.model('Badge', BadgeSchema);
