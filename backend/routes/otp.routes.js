const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');
const { body } = require('express-validator');

// Validation rules
const sendOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number')
];

const verifyOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resendOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

// Routes
router.post('/send-otp', sendOTPValidation, otpController.sendOTP);
router.post('/verify-otp', verifyOTPValidation, otpController.verifyOTP);
router.post('/resend-otp', resendOTPValidation, otpController.resendOTP);

module.exports = router;