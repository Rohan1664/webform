const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { downloadSubmissionsExcel, downloadSubmissionsCSV } = require('../utils/excel.generator');
const { authenticate } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Apply authentication and admin role check to all routes
router.use(authenticate, roleCheck('admin'));

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', adminController.getAllUsers);

// @route   PATCH /api/admin/users/:userId/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.patch('/users/:userId/status', adminController.updateUserStatus);

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics (admin only)
// @access  Private/Admin
router.get('/dashboard/stats', adminController.getDashboardStats);

// @route   GET /api/admin/forms/:formId/submissions/download/excel
// @desc    Download submissions as Excel (admin only)
// @access  Private/Admin
router.get('/forms/:formId/submissions/download/excel', downloadSubmissionsExcel);

// @route   GET /api/admin/forms/:formId/submissions/download/csv
// @desc    Download submissions as CSV (admin only)
// @access  Private/Admin
router.get('/forms/:formId/submissions/download/csv', downloadSubmissionsCSV);

module.exports = router;