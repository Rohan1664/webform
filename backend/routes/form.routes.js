const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { formValidator } = require('../utils/validators');

// ==================== Public Routes ====================

/**
 * @route   GET /api/forms
 * @desc    Get all active forms with pagination and search
 * @access  Public (with optional auth)
 */
router.get('/', optionalAuth, formController.getAllForms);

/**
 * @route   GET /api/forms/:formId
 * @desc    Get single form by ID with its fields
 * @access  Public (with optional auth)
 */
router.get('/:formId', optionalAuth, formController.getFormById);

// ==================== Protected Admin Routes ====================

/**
 * @route   POST /api/forms
 * @desc    Create a new form
 * @access  Private/Admin
 */
router.post('/', 
  authenticate, 
  roleCheck('admin'), 
  validate(formValidator), 
  formController.createForm
);

/**
 * @route   PUT /api/forms/:formId
 * @desc    Update an existing form
 * @access  Private/Admin
 */
router.put('/:formId', 
  authenticate, 
  roleCheck('admin'), 
  validate(formValidator), 
  formController.updateForm
);

/**
 * @route   DELETE /api/forms/:formId
 * @desc    Soft delete a form (set isActive to false)
 * @access  Private/Admin
 */
router.delete('/:formId', 
  authenticate, 
  roleCheck('admin'), 
  formController.deleteForm
);

module.exports = router;