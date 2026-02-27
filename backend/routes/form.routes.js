const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { authenticate } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { formValidator } = require('../utils/validators');

// Public routes (forms listing and viewing)
// @route   GET /api/forms
// @desc    Get all active forms
// @access  Public (with optional auth)
router.get('/', formController.getAllForms);

// @route   GET /api/forms/:formId
// @desc    Get single form by ID
// @access  Public (with optional auth)
router.get('/:formId', formController.getFormById);

// Protected routes (admin only)
// @route   POST /api/forms
// @desc    Create new form (admin only)
// @access  Private/Admin
router.post('/', authenticate, roleCheck('admin'), validate(formValidator), formController.createForm);

// @route   PUT /api/forms/:formId
// @desc    Update form (admin only)
// @access  Private/Admin
router.put('/:formId', authenticate, roleCheck('admin'), validate(formValidator), formController.updateForm);

// @route   DELETE /api/forms/:formId
// @desc    Delete form (admin only)
// @access  Private/Admin
router.delete('/:formId', authenticate, roleCheck('admin'), formController.deleteForm);

module.exports = router;