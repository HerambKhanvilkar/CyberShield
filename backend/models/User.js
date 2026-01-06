const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    select: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    select: true,
    unique: false
  },
  lastName: {
    type: String,
    required: false,
    select: true,
    unique: false
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  badges: [{
    badgeId: {
      type: String,
      select: true,
      default: null,
    },
    earnedDate: {
      type: Date,
      select: true,
      default: new Date(),
    },
    certificateId: {
      type: String,
      select: true,
      default: null,
    },
    isPublic: {
      type: Boolean,
      select: true,
      default: false,
    }
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  achievements: {
    type: Array,
    select: true,
    default: []
  },
  image: {
    type: String,
    select: true,
    default: null
  },
  courses: {
    type: Array,
    select: true,
    default: []
  },
  // --- New Profile/Portal Fields ---
  tags: {
    type: [String],
    default: [],
    select: true
  },
  ndaLegalName: {
    type: String,
    default: "",
    select: true
  },
  ndaDateTimeUser: {
    type: String, // Storing as String "HHMMSS DDMMYYYY" or ISO, user choice was HHMMSS DDMMYYYY but ISO is better for query. 
    // sticking to user req: "HHMMSS DDMMYYYY"
    default: "0",
    select: true
  },
  ndaDateTimeDC: {
    type: String,
    default: "0",
    select: true
  },
  pid: {
    type: String,
    default: "",
    select: true
  },
  tenure: [{
    type: { type: String, default: "" }, // 'Fellowship', etc.
    role: { type: String, default: "" },
    startDate: { type: String, default: "" }, // DDMMYYYY
    endDate: { type: String, default: "" }, // DDMMYYYY
    offerDateTime: { type: String, default: "0" }, // HHMMSS DDMMYYYY
    completion: { type: Number, default: 0 } // 0 or 1
  }],
  github: {
    type: String,
    default: "",
    select: true
  },
  linkedin: {
    type: String,
    default: "",
    select: true
  },
  // Email notification preferences
  emailPreferences: {
    badgeReceived: { type: Boolean, default: true },
    profileUpdate: { type: Boolean, default: true },
    adminDaily: { type: Boolean, default: true }
  },
  refreshToken: {
    type: String,
    default: "",
    select: false
  }
}, { timestamps: {} });

module.exports = mongoose.model('User', UserSchema);
