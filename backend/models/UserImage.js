const mongoose = require('mongoose');

const UserImageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  image: { type: Buffer, required: true, },
  contentType: { type: String, default: 'image/png', required: true, }
});


module.exports = mongoose.model('UserImage', UserImageSchema);
