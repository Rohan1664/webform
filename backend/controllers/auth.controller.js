const connectDB = require('../config/db');
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Register User
exports.register = async (req, res) => {
  try {
    await connectDB(); // Ensure database is connected
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || 'user'
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    await connectDB(); // Ensure database is connected
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    await connectDB();
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    await connectDB();
    
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};