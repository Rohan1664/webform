const connectDB = require('../config/db');
const Form = require('../models/Form.model');
const FormField = require('../models/FormField.model');
const FormSubmission = require('../models/FormSubmission.model');

// Create new form (admin only)
exports.createForm = async (req, res) => {
  try {
    await connectDB();
    
    const { title, description, settings, fields, appearance } = req.body;
    
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
      appearance: appearance || {},
      isActive: true
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
        layout: field.layout || { width: 'full' },
        helpText: field.helpText || '',
        order: field.order || index,
        isActive: true
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

// Get all forms
exports.getAllForms = async (req, res) => {
  try {
    await connectDB();
    
    const { page = 1, limit = 10, search = '', activeOnly = 'true' } = req.query;
    
    // Base query
    const query = {};
    
    // Filter by active status if specified
    if (activeOnly === 'true') {
      query.isActive = true;
    } else if (activeOnly === 'false') {
      query.isActive = false;
    }
    
    // Build search query
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    console.log('Fetching forms with query:', query);
    console.log('User role:', req.user ? req.user.role : 'No user');
    
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
    
    console.log(`Found ${forms.length} forms`);
    
    // Convert to objects and add virtual fields
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

// Get single form by ID - Allow admins to view inactive forms
exports.getFormById = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    
    // For admin users, allow viewing inactive forms
    // For regular users, only show active forms
    let query = { _id: formId };
    
    // If user is not admin, only show active forms
    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
    }
    
    const form = await Form.findOne(query)
      .populate('createdBy', 'firstName lastName email');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
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

// Update form (admin only) - FIXED with detailed error handling
exports.updateForm = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    const { title, description, settings, fields, isActive, appearance } = req.body;
    
    console.log('========================================');
    console.log('UPDATE FORM REQUEST RECEIVED');
    console.log('Form ID:', formId);
    console.log('Title:', title);
    console.log('isActive:', isActive);
    console.log('Fields count:', fields?.length || 0);
    console.log('========================================');
    
    // Check if form exists and belongs to admin
    const form = await Form.findOne({ 
      _id: formId,
      createdBy: req.user.userId 
    });
    
    if (!form) {
      console.log('Form not found or unauthorized');
      return res.status(404).json({
        success: false,
        message: 'Form not found or unauthorized'
      });
    }
    
    console.log('Form found, proceeding with update...');
    
    // Update form fields if provided
    if (title !== undefined) {
      console.log('Updating title to:', title);
      form.title = title.trim();
    }
    if (description !== undefined) {
      console.log('Updating description');
      form.description = description?.trim();
    }
    if (settings) {
      console.log('Updating settings');
      form.settings = { ...form.settings, ...settings };
    }
    if (appearance) {
      console.log('Updating appearance');
      form.appearance = { ...form.appearance, ...appearance };
    }
    if (isActive !== undefined) {
      console.log('Updating isActive to:', isActive);
      form.isActive = isActive;
    }
    
    await form.save();
    console.log('Form saved successfully');
    
    // Update fields if provided
    if (fields && Array.isArray(fields)) {
      console.log(`Processing ${fields.length} fields...`);
      
      // Get existing fields to check what needs to be updated
      const existingFields = await FormField.find({ formId: form._id });
      console.log(`Found ${existingFields.length} existing fields`);
      
      // Deactivate all existing fields first (we'll reactivate the ones we keep)
      await FormField.updateMany(
        { formId: form._id },
        { isActive: false }
      );
      console.log('Deactivated all existing fields');
      
      // Process each field from the request
      const fieldPromises = fields.map(async (field, index) => {
        try {
          console.log(`Processing field ${index}:`, field.name);
          
          const fieldData = {
            label: field.label?.trim(),
            fieldType: field.fieldType,
            name: field.name?.trim(),
            placeholder: field.placeholder?.trim(),
            options: field.options || [],
            validation: field.validation || {},
            layout: field.layout || { width: 'full' },
            helpText: field.helpText || '',
            order: index,
            isActive: true
          };
          
          // Check if this field has a valid MongoDB ID (not a temporary one)
          if (field._id && field._id.match(/^[0-9a-fA-F]{24}$/)) {
            // This is a real MongoDB ID, try to update existing field
            console.log(`Updating existing field with ID: ${field._id}`);
            const updated = await FormField.findByIdAndUpdate(
              field._id,
              fieldData,
              { new: true }
            );
            if (updated) {
              console.log(`Field ${field._id} updated successfully`);
              return updated;
            } else {
              console.log(`Field ${field._id} not found, creating new one`);
              // If field not found, create new
              const newField = new FormField({
                formId: form._id,
                ...fieldData
              });
              return await newField.save();
            }
          } else {
            // This is a temporary ID or no ID, create new field
            console.log('Creating new field');
            const newField = new FormField({
              formId: form._id,
              ...fieldData
            });
            return await newField.save();
          }
        } catch (fieldError) {
          console.error(`Error processing field ${index}:`, fieldError);
          // Don't throw here, continue with other fields
          return null;
        }
      });
      
      const savedFields = await Promise.all(fieldPromises);
      console.log(`Successfully saved ${savedFields.filter(f => f).length} fields`);
    }
    
    // Fetch updated form with fields
    const updatedForm = await Form.findById(form._id)
      .populate('createdBy', 'firstName lastName email');
    
    const updatedFields = await FormField.find({ 
      formId: form._id,
      isActive: true 
    }).sort('order');
    
    console.log('Update completed successfully');
    console.log(`Returning ${updatedFields.length} active fields`);
    
    res.json({
      success: true,
      message: 'Form updated successfully',
      data: {
        form: updatedForm,
        fields: updatedFields
      }
    });
    
  } catch (error) {
    console.error('========================================');
    console.error('UPDATE FORM ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================');
    
    res.status(500).json({
      success: false,
      message: 'Error updating form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Toggle form status (admin only)
exports.toggleFormStatus = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    
    console.log('Toggling form status for ID:', formId);
    
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
    
    // Toggle the status
    form.isActive = !form.isActive;
    await form.save();
    
    console.log(`Form ${formId} status toggled to: ${form.isActive}`);
    
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

// Delete form (admin only) - HARD DELETE for permanent deletion
exports.deleteForm = async (req, res) => {
  try {
    await connectDB();
    
    const { formId } = req.params;
    
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
    
    // HARD DELETE - permanently remove from database
    await Form.findByIdAndDelete(formId);
    
    // Also delete all associated fields and submissions
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