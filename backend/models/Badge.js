const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  // Human-facing badge identifier. Format: <PREFIX><6-digit-number> e.g. CA000100
  badgeId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  },
 //  difficulty: {
 //    type: String,
 //    enum: ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'],
 //    default: 'Medium'
 //  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: String,
    // enum: ['Amateur', 'Intermediate', 'Professional'],
    required: true
  },
  vertical: {
    type: String,
    // enum: ['Information Security', 'Incident Response and Management', 'Cybersecurity', 'Cybersecurity Professional Development'],
    required: true
  },
  skillsEarned: [{
    type: String,
  }],
  course: {
    type: String,
    default: ''
  },
  // Incrementing counter used to generate unique certificate IDs for this badge
  certificateCounter: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Badge', BadgeSchema);
