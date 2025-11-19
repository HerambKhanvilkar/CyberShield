const mongoose = require('mongoose');

const BadgesEarnedSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true
  },
  badges: [
    {
      badgeId: String,
      // Unique certificate id for this issuance (e.g. CA000100001)
      certificateId: {
        type: String,
        required: false,
        default: null
      },
      earnedDate: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model('BadgesEarned', BadgesEarnedSchema);