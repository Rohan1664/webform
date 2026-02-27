const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Form title is required'],
    trim: true,
    maxlength: [200, 'Form title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Form creator is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowMultipleSubmissions: {
      type: Boolean,
      default: false
    },
    requireLogin: {
      type: Boolean,
      default: true
    },
    confirmationMessage: {
      type: String,
      default: 'Thank you for your submission!'
    },
    redirectUrl: {
      type: String,
      trim: true
    },
    submissionLimit: {
      type: Number,
      min: 0,
      default: 0 // 0 means unlimited
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    submitButtonText: {
      type: String,
      default: 'Submit'
    }
  },
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    uniqueSubmitters: {
      type: Number,
      default: 0
    },
    lastSubmissionAt: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update updatedAt before save
formSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual populate for fields
formSchema.virtual('fields', {
  ref: 'FormField',
  localField: '_id',
  foreignField: 'formId',
  options: { sort: { order: 1 } }
});

// Virtual for submissions
formSchema.virtual('submissions', {
  ref: 'FormSubmission',
  localField: '_id',
  foreignField: 'formId'
});

// Check if form is accepting submissions
formSchema.methods.isAcceptingSubmissions = function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  
  if (this.settings.startDate && now < this.settings.startDate) return false;
  if (this.settings.endDate && now > this.settings.endDate) return false;
  
  if (this.settings.submissionLimit > 0 && 
      this.stats.totalSubmissions >= this.settings.submissionLimit) {
    return false;
  }
  
  return true;
};

// Indexes for faster queries
formSchema.index({ createdBy: 1, createdAt: -1 });
formSchema.index({ isActive: 1 });
formSchema.index({ 'settings.startDate': 1, 'settings.endDate': 1 });
formSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Form', formSchema);