const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: [true, 'Form ID is required']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  submissionData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: [true, 'Submission data is required']
  },
  files: [{
    fieldName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    referrer: {
      type: String
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    completionTime: {
      type: Number // Time taken to complete form in seconds
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      editedAt: Date,
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changes: mongoose.Schema.Types.Mixed
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'archived'],
    default: 'pending'
  },
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updatedAt before save
submissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
submissionSchema.index({ formId: 1, submittedAt: -1 });
submissionSchema.index({ submittedBy: 1, submittedAt: -1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ 'metadata.ipAddress': 1 });
submissionSchema.index({ submittedAt: -1 });

// Compound indexes for common queries
submissionSchema.index({ formId: 1, status: 1, submittedAt: -1 });
submissionSchema.index({ formId: 1, submittedBy: 1 });

// Static method to get submission statistics
submissionSchema.statics.getStats = async function(formId) {
  const stats = await this.aggregate([
    { $match: { formId: mongoose.Types.ObjectId(formId) } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        uniqueSubmitters: { $addToSet: '$submittedBy' },
        averageCompletionTime: { $avg: '$metadata.completionTime' },
        lastSubmission: { $max: '$submittedAt' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSubmissions: 1,
        uniqueSubmitters: { $size: '$uniqueSubmitters' },
        averageCompletionTime: { $round: ['$averageCompletionTime', 2] },
        lastSubmission: 1
      }
    }
  ]);

  return stats[0] || {
    totalSubmissions: 0,
    uniqueSubmitters: 0,
    averageCompletionTime: 0,
    lastSubmission: null
  };
};

// Get submissions by date range
submissionSchema.statics.getByDateRange = async function(formId, startDate, endDate) {
  const query = { formId: mongoose.Types.ObjectId(formId) };
  
  if (startDate || endDate) {
    query.submittedAt = {};
    if (startDate) query.submittedAt.$gte = new Date(startDate);
    if (endDate) query.submittedAt.$lte = new Date(endDate);
  }
  
  return this.find(query).sort({ submittedAt: -1 });
};

module.exports = mongoose.model('FormSubmission', submissionSchema);