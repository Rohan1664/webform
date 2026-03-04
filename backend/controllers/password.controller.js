const connectDB = require('../config/db');
const OTP = require('../models/OTP.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const { generateOTP, sendPasswordResetEmail } = require('../services/email.service');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Request password reset - send OTP
exports.requestPasswordReset = async (req, res) => {
  try {
    await connectDB();
    
    console.log('🔑 Password reset requested for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP for password reset:', otp);

    // Delete any existing OTP for this email with password reset purpose
    await OTP.deleteMany({ email, purpose: 'password_reset' });

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      purpose: 'password_reset'
    });
    await otpRecord.save();
    console.log('OTP saved to database for password reset');

    // Send OTP via email
    const emailSent = await sendPasswordResetEmail(email, otp, user.firstName);

    if (!emailSent) {
      console.error('Failed to send password reset email');
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    console.log('Password reset email sent successfully');

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP for password reset
exports.verifyResetOTP = async (req, res) => {
  try {
    await connectDB();
    
    const { email, otp } = req.body;

    console.log('Verifying password reset OTP for:', email);

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      otp: otp,
      purpose: 'password_reset',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      console.log('Invalid or expired OTP for password reset');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    console.log('OTP verified successfully');

    // Generate a temporary token for password reset (valid for 10 minutes)
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET + '_reset',
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    await connectDB();
    
    const { resetToken, newPassword } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET + '_reset');
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const { email } = decoded;

    console.log('Resetting password for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    user.updatedAt = Date.now();
    await user.save();

    // Delete all password reset OTPs for this email
    await OTP.deleteMany({ email, purpose: 'password_reset' });

    console.log('Password reset successfully for:', email);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};