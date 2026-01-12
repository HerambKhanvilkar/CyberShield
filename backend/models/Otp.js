const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true,
    unique: false
  },
  expiry: {
    type: Date,
    required: true,
    unique: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - auto-delete after expiry
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', OtpSchema);
