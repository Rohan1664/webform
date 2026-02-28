const connectDB = require('../config/db');
const Form = require('../models/Form.model');
const FormField = require('../models/FormField.model');
const FormSubmission = require('../models/FormSubmission.model');

// Submit form response
exports.submitForm = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    const submissionData = req.body;
    const files = req.files;
    
    // Check if form exists and is active
    const form = await Form.findOne({ 
      _id: formId,
      isActive: true 
    });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or inactive'
      });
    }
    
    // Check if login is required
    if (form.settings.requireLogin && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Login required to submit this form'
      });
    }
    
    // Get form fields for validation
    const formFields = await FormField.find({ 
      formId: form._id,
      isActive: true 
    });
    
    // Validate submission data
    const validatedData = new Map();
    const errors = [];
    
    for (const field of formFields) {
      const value = submissionData[field.name];
      
      // Check required fields
      if (field.validation.required && (!value || value === '')) {
        errors.push(`${field.label} is required`);
        continue;
      }
      
      // Type-specific validation
      if (value !== undefined && value !== '') {
        switch (field.fieldType) {
          case 'number':
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`${field.label} must be a valid number`);
            } else {
              if (field.validation.min !== undefined && numValue < field.validation.min) {
                errors.push(`${field.label} must be at least ${field.validation.min}`);
              }
              if (field.validation.max !== undefined && numValue > field.validation.max) {
                errors.push(`${field.label} must be at most ${field.validation.max}`);
              }
            }
            validatedData.set(field.name, numValue);
            break;
            
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`${field.label} must be a valid email address`);
            } else {
              validatedData.set(field.name, value);
            }
            break;
            
          case 'text':
          case 'textarea':
            if (field.validation.minLength && value.length < field.validation.minLength) {
              errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
            } else if (field.validation.maxLength && value.length > field.validation.maxLength) {
              errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
            } else if (field.validation.pattern) {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(value)) {
                errors.push(`${field.label} format is invalid`);
              } else {
                validatedData.set(field.name, value);
              }
            } else {
              validatedData.set(field.name, value);
            }
            break;
            
          default:
            validatedData.set(field.name, value);
        }
      } else if (value !== undefined) {
        validatedData.set(field.name, value);
      }
    }
    
    // Handle file uploads (for Vercel - files are in memory, not on disk)
    const fileEntries = [];
    if (files && files.files) {
      // For Vercel deployment, you would upload these files to cloud storage
      // This is a simplified version - you should implement cloud storage
      for (const file of files.files) {
        const fieldName = file.fieldname;
        const field = formFields.find(f => f.name === fieldName);
        
        if (field && field.fieldType === 'file') {
          fileEntries.push({
            fieldName: field.name,
            originalName: file.originalname,
            fileName: file.originalname, // Simplified
            filePath: '', // No file path in memory storage
            fileSize: file.size,
            mimeType: file.mimetype
          });
          
          validatedData.set(field.name, file.originalname);
        }
      }
    }
    
    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }
    
    // Check if user has already submitted (if multiple submissions not allowed)
    if (!form.settings.allowMultipleSubmissions && req.user) {
      const existingSubmission = await FormSubmission.findOne({
        formId: form._id,
        submittedBy: req.user.userId
      });
      
      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this form'
        });
      }
    }
    
    // Create submission
    const submission = new FormSubmission({
      formId: form._id,
      submittedBy: req.user ? req.user.userId : null,
      submissionData: Object.fromEntries(validatedData),
      files: fileEntries
    });
    
    await submission.save();
    
    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        submissionId: submission._id,
        submittedAt: submission.submittedAt
      }
    });
    
  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get submissions for a form (admin only)
exports.getFormSubmissions = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'submittedAt', 
      sortOrder = 'desc',
      search = '',
      startDate,
      endDate
    } = req.query;
    
    // Verify form exists and belongs to admin
    const form = await Form.findOne({ 
      _id: formId,
      createdBy: req.user.userId 
    });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or unauthorized'
      });
    }
    
    const query = { formId: form._id };
    
    // Date range filter
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }
    
    // Search in submission data
    if (search) {
      query.$or = [
        { 'submittedBy': { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    // Get submissions with pagination
    const submissions = await FormSubmission.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitInt);
    
    // Get total count
    const totalSubmissions = await FormSubmission.countDocuments(query);
    const totalPages = Math.ceil(totalSubmissions / limitInt);
    
    res.json({
      success: true,
      data: {
        form,
        submissions,
        pagination: {
          page: pageInt,
          limit: limitInt,
          totalSubmissions,
          totalPages,
          hasNextPage: pageInt < totalPages,
          hasPrevPage: pageInt > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get form submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single submission
exports.getSubmissionById = async (req, res) => {
  try {
    await connectDB();
    
    const { submissionId } = req.params;
    
    const submission = await FormSubmission.findById(submissionId)
      .populate('submittedBy', 'firstName lastName email')
      .populate('formId', 'title description');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check authorization
    const form = await Form.findById(submission.formId);
    const isAdmin = req.user.role === 'admin' && form.createdBy.toString() === req.user.userId;
    const isOwner = submission.submittedBy && submission.submittedBy._id.toString() === req.user.userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this submission'
      });
    }
    
    // Get form fields for better display
    const formFields = await FormField.find({ 
      formId: submission.formId,
      isActive: true 
    }).sort('order');
    
    res.json({
      success: true,
      data: {
        submission,
        formFields
      }
    });
    
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete submission (admin only)
exports.deleteSubmission = async (req, res) => {
  try {
    await connectDB();
    
    const { submissionId } = req.params;
    
    const submission = await FormSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Verify admin owns the form
    const form = await Form.findOne({ 
      _id: submission.formId,
      createdBy: req.user.userId 
    });
    
    if (!form) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this submission'
      });
    }
    
    await FormSubmission.findByIdAndDelete(submissionId);
    
    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};