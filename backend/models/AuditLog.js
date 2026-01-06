const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null if it's a system action or anonymous (though usually tied to user)
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_OTP',
      'NAME_CONFIRM', 
      'NDA_SIGN',
      'NDA_DOWNLOAD',
      'OFFER_UNLOCK',
      'OFFER_DOWNLOAD',
      'PROFILE_UPDATE',
      'APPLICATION_SUBMIT',
      'OTHER'
    ]
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
