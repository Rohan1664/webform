const connectDB = require('../config/db');
const OTP = require('../models/OTP.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTPEmail } = require('../services/email.service');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Send OTP for registration
exports.sendOTP = async (req, res) => {
  try {
    await connectDB();
    
    console.log('📧 Send OTP request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, firstName, lastName, password } = req.body;

    console.log('Processing OTP request for email:', email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP for', email, ':', otp);

    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      firstName,
      lastName,
      password: hashedPassword
    });
    await otpRecord.save();
    console.log('OTP saved to database for:', email);

    // Send OTP via email
    console.log('Attempting to send email to:', email);
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      console.error('Failed to send email to:', email);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please check email configuration.'
      });
    }

    console.log('Email sent successfully to:', email);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP and complete registration
exports.verifyOTP = async (req, res) => {
  try {
    await connectDB();
    
    const { email, otp } = req.body;

    console.log('Verifying OTP for:', email, 'OTP:', otp);

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      otp: otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      console.log('Invalid or expired OTP for:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    console.log('OTP verified successfully for:', email);

    // Check if user was already created
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists, cleaning up OTP:', email);
      await OTP.deleteMany({ email });
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      email: otpRecord.email,
      password: otpRecord.password,
      firstName: otpRecord.firstName,
      lastName: otpRecord.lastName,
      role: 'user',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });

    await user.save();
    console.log('User created successfully:', user._id);

    // Delete used OTP
    await OTP.deleteMany({ email });

    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Email verified and account created successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
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

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    await connectDB();
    
    const { email } = req.body;

    console.log('Resending OTP for:', email);

    // Find existing OTP record
    const existingOTP = await OTP.findOne({ email: email.toLowerCase() });

    if (!existingOTP) {
      console.log('No pending registration found for:', email);
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email'
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    console.log('Generated new OTP:', newOTP);

    // Update OTP
    existingOTP.otp = newOTP;
    existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await existingOTP.save();
    console.log('OTP updated in database');

    // Send new OTP
    const emailSent = await sendOTPEmail(email, newOTP);

    if (!emailSent) {
      console.error('Failed to resend email to:', email);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    console.log('OTP resent successfully to:', email);

    res.json({
      success: true,
      message: 'OTP resent successfully'
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};