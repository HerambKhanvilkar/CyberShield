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
    required: true ,
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
  refreshToken: {
    type: String,
    default: "" ,
    select: false
  }
}, { timestamps: { } });

module.exports = mongoose.model('User', UserSchema);
