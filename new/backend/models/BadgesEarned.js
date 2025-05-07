const mongoose = require('mongoose');

const BadgesEarnedSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true
  },
  badges: [
    {
      badgeId: Number,
      earnedDate: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model('BadgesEarned', BadgesEarnedSchema);