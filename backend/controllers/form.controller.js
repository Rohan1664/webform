const connectDB = require('../config/db');
const Form = require('../models/Form.model');
const FormField = require('../models/FormField.model');
const FormSubmission = require('../models/FormSubmission.model');

// Create new form (admin only)
exports.createForm = async (req, res) => {
  try {
    await connectDB();
    
    const { title, description, settings, fields } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Form title is required'
      });
    }
    
    // Create form - explicitly set isActive to true
    const form = new Form({
      title: title.trim(),
      description: description?.trim(),
      createdBy: req.user.userId,
      settings: settings || {},
      isActive: true // Explicitly set to true
    });
    
    await form.save();
    
    // Create form fields if provided
    if (fields && Array.isArray(fields)) {
      const formFields = fields.map((field, index) => ({
        formId: form._id,
        label: field.label?.trim(),
        fieldType: field.fieldType,
        name: field.name?.trim(),
        placeholder: field.placeholder?.trim(),
        options: field.options || [],
        validation: field.validation || {},
        order: field.order || index,
        isActive: true // Explicitly set to true
      }));
      
      await FormField.insertMany(formFields);
    }
    
    // Fetch complete form with fields
    const completeForm = await Form.findById(form._id)
      .populate('createdBy', 'firstName lastName email');
    
    const formFields = await FormField.find({ formId: form._id }).sort('order');
    
    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: {
        form: completeForm,
        fields: formFields
      }
    });
    
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all forms - FIXED VERSION
exports.getAllForms = async (req, res) => {
  try {
    await connectDB();
    
    const { page = 1, limit = 10, search = '', activeOnly = 'true' } = req.query;
    
    // Base query - only active forms
    const query = { isActive: activeOnly === 'true' };
    
    // Build search query
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // FIX: For regular users, show all active forms
    // Don't filter by requireLogin here - let the frontend handle that
    // This ensures users see all active forms regardless of login requirement
    
    console.log('Fetching forms with query:', query); // Debug log
    console.log('User role:', req.user ? req.user.role : 'No user'); // Debug log
    
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    // Get forms with pagination
    const forms = await Form.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);
    
    // Get total count
    const totalForms = await Form.countDocuments(query);
    const totalPages = Math.ceil(totalForms / limitInt);
    
    console.log(`Found ${forms.length} forms`); // Debug log
    
    res.json({
      success: true,
      data: {
        forms,
        pagination: {
          page: pageInt,
          limit: limitInt,
          totalForms,
          totalPages,
          hasNextPage: pageInt < totalPages,
          hasPrevPage: pageInt > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get all forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single form by ID
exports.getFormById = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    
    const form = await Form.findOne({ 
      _id: formId,
      isActive: true 
    }).populate('createdBy', 'firstName lastName email');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or inactive'
      });
    }
    
    const fields = await FormField.find({ 
      formId: form._id,
      isActive: true 
    }).sort('order');
    
    res.json({
      success: true,
      data: {
        form,
        fields
      }
    });
    
  } catch (error) {
    console.error('Get form by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update form (admin only)
exports.updateForm = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    const { title, description, settings, fields } = req.body;
    
    // Check if form exists and belongs to admin
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
    
    // Update form
    if (title) form.title = title.trim();
    if (description !== undefined) form.description = description.trim();
    if (settings) form.settings = { ...form.settings, ...settings };
    
    await form.save();
    
    // Update fields if provided
    if (fields && Array.isArray(fields)) {
      // First, deactivate all existing fields
      await FormField.updateMany(
        { formId: form._id },
        { isActive: false }
      );
      
      // Create/update fields
      const fieldPromises = fields.map(async (field, index) => {
        if (field._id) {
          // Update existing field
          return FormField.findOneAndUpdate(
            { 
              _id: field._id,
              formId: form._id 
            },
            {
              label: field.label?.trim(),
              fieldType: field.fieldType,
              name: field.name?.trim(),
              placeholder: field.placeholder?.trim(),
              options: field.options || [],
              validation: field.validation || {},
              order: field.order || index,
              isActive: true // Set to true when updating
            },
            { new: true, upsert: false }
          );
        } else {
          // Create new field
          const newField = new FormField({
            formId: form._id,
            label: field.label?.trim(),
            fieldType: field.fieldType,
            name: field.name?.trim(),
            placeholder: field.placeholder?.trim(),
            options: field.options || [],
            validation: field.validation || {},
            order: field.order || index,
            isActive: true // Explicitly set to true
          });
          return newField.save();
        }
      });
      
      await Promise.all(fieldPromises);
    }
    
    // Fetch updated form with fields
    const updatedForm = await Form.findById(form._id)
      .populate('createdBy', 'firstName lastName email');
    
    const updatedFields = await FormField.find({ formId: form._id })
      .sort('order');
    
    res.json({
      success: true,
      message: 'Form updated successfully',
      data: {
        form: updatedForm,
        fields: updatedFields
      }
    });
    
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete form (admin only)
exports.deleteForm = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    
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
    
    // Soft delete - set isActive to false
    form.isActive = false;
    await form.save();
    
    // Also deactivate all fields
    await FormField.updateMany(
      { formId: form._id },
      { isActive: false }
    );
    
    res.json({
      success: true,
      message: 'Form deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};