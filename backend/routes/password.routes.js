const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/password.controller');
const { body } = require('express-validator');

// Validation rules
const requestResetValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const verifyOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resetPasswordValidation = [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number')
];

// Routes
router.post('/request-reset', requestResetValidation, passwordController.requestPasswordReset);
router.post('/verify-otp', verifyOTPValidation, passwordController.verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, passwordController.resetPassword);

module.exports = router;