const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  expiry: { 
    type: Date,
    required: true, 
    unique: false 
  },
  otp: { 
    type: String, 
    required: true, 
    unique: false 
  },
}, { timestamps: { } });

module.exports = mongoose.model('Otp', OtpSchema);
