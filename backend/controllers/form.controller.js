const connectDB = require('../config/db');
const Form = require('../models/Form.model');
const FormField = require('../models/FormField.model');
const FormSubmission = require('../models/FormSubmission.model');

// Create new form (admin only)
exports.createForm = async (req, res) => {
  try {
    await connectDB();
    
    const { title, description, settings, fields, appearance } = req.body;
    
    console.log('========================================');
    console.log('CREATE FORM REQUEST');
    console.log('Title:', title);
    console.log('Fields count:', fields?.length || 0);
    console.log('========================================');
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Form title is required'
      });
    }
    
    // Create form
    const form = new Form({
      title: title.trim(),
      description: description?.trim(),
      createdBy: req.user.userId,
      settings: settings || {},
      appearance: appearance || {},
      isActive: true
    });
    
    await form.save();
    console.log('Form saved with ID:', form._id);
    
    // Create form fields if provided
    if (fields && Array.isArray(fields) && fields.length > 0) {
      console.log(`Processing ${fields.length} fields...`);
      
      const formFields = fields.map((field, index) => ({
        formId: form._id,
        label: field.label || `Field ${index + 1}`,
        fieldType: field.fieldType || 'text',
        name: field.name || `field_${index}`,
        placeholder: field.placeholder || '',
        options: field.options || [],
        validation: field.validation || {},
        layout: field.layout || { width: 'full' },
        helpText: field.helpText || '',
        order: index,
        isActive: true
      }));
      
      const savedFields = await FormField.insertMany(formFields);
      console.log(`${savedFields.length} fields saved successfully`);
    }
    
    // Fetch complete form with fields
    const completeForm = await Form.findById(form._id)
      .populate('createdBy', 'firstName lastName email');
    
    const formFields = await FormField.find({ 
      formId: form._id 
    }).sort('order');
    
    console.log(`Returning form with ${formFields.length} fields`);
    
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

// Get all forms
exports.getAllForms = async (req, res) => {
  try {
    await connectDB();
    
    const { page = 1, limit = 10, search = '', activeOnly = 'true' } = req.query;
    
    const query = {};
    
    if (activeOnly === 'true') {
      query.isActive = true;
    } else if (activeOnly === 'false') {
      query.isActive = false;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    const forms = await Form.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);
    
    const totalForms = await Form.countDocuments(query);
    const totalPages = Math.ceil(totalForms / limitInt);
    
    const formsWithVirtuals = forms.map(form => {
      const formObj = form.toObject();
      formObj.hasReachedSubmissionLimit = form.hasReachedSubmissionLimit;
      formObj.remainingSubmissions = form.remainingSubmissions;
      return formObj;
    });
    
    res.json({
      success: true,
      data: {
        forms: formsWithVirtuals,
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
    
    console.log('Getting form by ID:', formId);
    
    const form = await Form.findById(formId)
      .populate('createdBy', 'firstName lastName email');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    const fields = await FormField.find({ 
      formId: form._id 
    }).sort('order');
    
    console.log(`Found ${fields.length} fields for form`);
    
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
    const { title, description, settings, fields, isActive, appearance } = req.body;
    
    console.log('========================================');
    console.log('UPDATE FORM REQUEST');
    console.log('Form ID:', formId);
    console.log('Fields count:', fields?.length || 0);
    console.log('========================================');
    
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
    
    // Update form fields
    if (title !== undefined) form.title = title.trim();
    if (description !== undefined) form.description = description?.trim();
    if (settings) form.settings = { ...form.settings, ...settings };
    if (appearance) form.appearance = { ...form.appearance, ...appearance };
    if (isActive !== undefined) form.isActive = isActive;
    
    await form.save();
    
    // Update fields if provided
    if (fields && Array.isArray(fields)) {
      // Delete all existing fields
      await FormField.deleteMany({ formId: form._id });
      
      // Create new fields
      const formFields = fields.map((field, index) => ({
        formId: form._id,
        label: field.label || `Field ${index + 1}`,
        fieldType: field.fieldType || 'text',
        name: field.name || `field_${index}`,
        placeholder: field.placeholder || '',
        options: field.options || [],
        validation: field.validation || {},
        layout: field.layout || { width: 'full' },
        helpText: field.helpText || '',
        order: index,
        isActive: true
      }));
      
      await FormField.insertMany(formFields);
    }
    
    const updatedForm = await Form.findById(form._id)
      .populate('createdBy', 'firstName lastName email');
    
    const updatedFields = await FormField.find({ 
      formId: form._id 
    }).sort('order');
    
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

// Toggle form status
exports.toggleFormStatus = async (req, res) => {
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
    
    form.isActive = !form.isActive;
    await form.save();
    
    res.json({
      success: true,
      message: `Form ${form.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: form._id,
        isActive: form.isActive
      }
    });
    
  } catch (error) {
    console.error('Toggle form status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling form status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete form - HARD DELETE
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
    
    // Delete form and all associated data
    await Form.findByIdAndDelete(formId);
    await FormField.deleteMany({ formId: formId });
    await FormSubmission.deleteMany({ formId: formId });
    
    res.json({
      success: true,
      message: 'Form permanently deleted successfully'
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