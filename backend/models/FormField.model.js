const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: [true, 'Form ID is required']
  },
  label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true,
    maxlength: [100, 'Field label cannot exceed 100 characters']
  },
  fieldType: {
    type: String,
    required: [true, 'Field type is required'],
    enum: {
      values: ['text', 'number', 'email', 'textarea', 'dropdown', 'checkbox', 'radio', 'file'],
      message: '{VALUE} is not a valid field type'
    }
  },
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9_]+$/, 'Field name can only contain letters, numbers, and underscores']
  },
  placeholder: {
    type: String,
    trim: true,
    maxlength: [100, 'Placeholder cannot exceed 100 characters']
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  options: [{
    label: {
      type: String,
      required: [true, 'Option label is required'],
      trim: true
    },
    value: {
      type: String,
      required: [true, 'Option value is required'],
      trim: true
    }
  }],
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    minLength: {
      type: Number,
      min: 0
    },
    maxLength: {
      type: Number,
      min: 1
    },
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    pattern: {
      type: String,
      trim: true
    },
    patternMessage: {
      type: String,
      trim: true
    },
    fileTypes: [{
      type: String,
      lowercase: true,
      enum: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx']
    }],
    maxFileSize: {
      type: Number,
      min: 1024, // 1KB
      max: 10485760, // 10MB
      default: 5242880 // 5MB
    },
    minFileCount: {
      type: Number,
      min: 0,
      default: 0
    },
    maxFileCount: {
      type: Number,
      min: 1,
      max: 10,
      default: 1
    },
    customValidation: {
      type: String,
      trim: true
    }
  },
  layout: {
    width: {
      type: String,
      enum: ['full', 'half', 'third', 'quarter'],
      default: 'full'
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    cssClass: {
      type: String,
      trim: true
    }
  },
  order: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  helpText: {
    type: String,
    trim: true,
    maxlength: [200, 'Help text cannot exceed 200 characters']
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
  timestamps: true
});

// Ensure field names are unique within a form
fieldSchema.index({ formId: 1, name: 1 }, { unique: true });

// Index for faster queries
fieldSchema.index({ formId: 1, order: 1 });
fieldSchema.index({ formId: 1, isActive: 1 });

// Update updatedAt before save
fieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-validate hook to ensure options for dropdown/checkbox/radio
fieldSchema.pre('validate', function(next) {
  if (['dropdown', 'checkbox', 'radio'].includes(this.fieldType)) {
    if (!this.options || this.options.length === 0) {
      next(new Error(`${this.fieldType} fields must have at least one option`));
    }
  }
  next();
});

module.exports = mongoose.model('FormField', fieldSchema);