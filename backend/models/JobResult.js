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
    type: Object,
  },
  status: { 
    type: String,
  },
  processedAt: {
    type: Date,
  }
}, { timestamps: { } });

module.exports = mongoose.model('JobResult', JobResultSchema);
