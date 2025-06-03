const mongoose = require('mongoose');

const JobResultSchema = new mongoose.Schema({
  jobId: { 
    type: String, 
    required: true, 
  },
  userId: { 
    type: String, 
    required: true, 
  },
  result: {
    type: mongoose.Schema.Types.Mixed, // Field where frontend can send updated error data for processing
    default: null
  },
  revision: {
    type: mongoose.Schema.Types.Mixed, // Field where frontend can send updated error data for processing
    default: null
  },
  status: { 
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  revisionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processedAt: {
    type: Date,
  },
  importedUsers: {
    type: mongoose.Schema.Types.Mixed, // Field where frontend can send updated error data for processing
    default: null,
  },
}, { timestamps: { } });

module.exports = mongoose.model('JobResult', JobResultSchema);
