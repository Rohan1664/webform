const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { multipleUpload } = require('../config/multer.config');

// @route   POST /api/submissions/:formId
// @desc    Submit form response
// @access  Public (with optional auth based on form settings)
router.post('/:formId', optionalAuth, multipleUpload, submissionController.submitForm);

// @route   GET /api/submissions/form/:formId
// @desc    Get submissions for a form (admin only)
// @access  Private/Admin
router.get('/form/:formId', authenticate, roleCheck('admin'), submissionController.getFormSubmissions);

// @route   GET /api/submissions/:submissionId
// @desc    Get single submission
// @access  Private (admin or submission owner)
router.get('/:submissionId', authenticate, submissionController.getSubmissionById);

// @route   DELETE /api/submissions/:submissionId
// @desc    Delete submission (admin only)
// @access  Private/Admin
router.delete('/:submissionId', authenticate, roleCheck('admin'), submissionController.deleteSubmission);

module.exports = router;