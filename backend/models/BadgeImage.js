const mongoose = require('mongoose');

const BadgeImageSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  image: { type: Buffer, required: true, },
  contentType: { type: String, default: 'image/png', required: true, }
});


module.exports = mongoose.model('BadgeImage', BadgeImageSchema);
