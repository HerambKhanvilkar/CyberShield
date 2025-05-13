const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  firstName: { 
    type: String, 
    required: true, 
    unique: false 
  },
  lastName: { 
    type: String, 
    required: false, 
    unique: false 
  },
  password: { 
    type: String, 
    required: true 
  },
  badges: {
    type: Array,
    default: []
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', UserSchema);
