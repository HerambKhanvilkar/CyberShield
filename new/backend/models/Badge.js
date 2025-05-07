const mongoose = require('mongoose');

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
    required: true
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
  category: {
    type: String,
    enum: ['Amateur', 'Intermediate', 'Professional', 'Expert'],
    required: true
  },
  skillsEarned: [{
    type: String
  }]
});

module.exports = mongoose.model('Badge', BadgeSchema);