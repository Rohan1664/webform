const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const userExportController = require('../controllers/userExport.controller'); // Add this import
const { downloadSubmissionsExcel, downloadSubmissionsCSV } = require('../utils/excel.generator');
const { authenticate } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Apply authentication and admin role check to all routes
router.use(authenticate, roleCheck('admin'));

// ==================== User Management Routes ====================

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', adminController.getAllUsers);

// @route   PATCH /api/admin/users/:userId/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.patch('/users/:userId/status', adminController.updateUserStatus);

// @route   GET /api/admin/users/export/excel
// @desc    Export users to Excel (admin only)
// @access  Private/Admin
router.get('/users/export/excel', userExportController.exportUsersToExcel);

// @route   GET /api/admin/users/export/csv
// @desc    Export users to CSV (admin only)
// @access  Private/Admin
router.get('/users/export/csv', userExportController.exportUsersToCSV);

// ==================== Dashboard Routes ====================

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics (admin only)
// @access  Private/Admin
router.get('/dashboard/stats', adminController.getDashboardStats);

// ==================== Form Submissions Export Routes ====================

// @route   GET /api/admin/forms/:formId/submissions/download/excel
// @desc    Download submissions as Excel (admin only)
// @access  Private/Admin
router.get('/forms/:formId/submissions/download/excel', downloadSubmissionsExcel);

// @route   GET /api/admin/forms/:formId/submissions/download/csv
// @desc    Download submissions as CSV (admin only)
// @access  Private/Admin
router.get('/forms/:formId/submissions/download/csv', downloadSubmissionsCSV);

module.exports = router;