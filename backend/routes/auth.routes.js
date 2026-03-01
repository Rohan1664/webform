const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { registerValidator, loginValidator } = require('../utils/validators');
const jwt = require('jsonwebtoken');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerValidator), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 */
router.post('/login', validate(loginValidator), authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

// ==================== GOOGLE OAUTH ROUTES ====================

// Hardcoded production URL to avoid any mismatch
const PROD_GOOGLE_CALLBACK = 'https://webform-nine.vercel.app/api/auth/google/callback';
const PROD_GITHUB_CALLBACK = 'https://webform-nine.vercel.app/api/auth/github/callback';

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', (req, res, next) => {
  // Use hardcoded production URL
  const callbackURL = PROD_GOOGLE_CALLBACK;
  
  console.log('\n🔐 Google OAuth Initiated');
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('  Callback URL being used:', callbackURL);
  console.log('  This MUST match exactly in Google Cloud Console');
  console.log('  Expected in Google Console:', callbackURL);
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    callbackURL: callbackURL // Explicitly set callback URL
  })(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google-auth-failed`,
    session: false 
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      );
      
      // Prepare user data
      const userData = {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      };
      
      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('✅ Google OAuth successful, redirecting to:', frontendUrl);
      
      res.redirect(
        `${frontendUrl}/oauth-callback?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`
      );
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth-failed`);
    }
  }
);

// ==================== GITHUB OAUTH ROUTES ====================

/**
 * @route   GET /api/auth/github
 * @desc    Initiate GitHub OAuth
 * @access  Public
 */
router.get('/github', (req, res, next) => {
  // Use hardcoded production URL
  const callbackURL = PROD_GITHUB_CALLBACK;
  
  console.log('\n🔐 GitHub OAuth Initiated');
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('  Callback URL being used:', callbackURL);
  
  passport.authenticate('github', { 
    scope: ['user:email'],
    callbackURL: callbackURL // Explicitly set callback URL
  })(req, res, next);
});

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=github-auth-failed`,
    session: false 
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      );
      
      // Prepare user data
      const userData = {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      };
      
      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('✅ GitHub OAuth successful, redirecting to:', frontendUrl);
      
      res.redirect(
        `${frontendUrl}/oauth-callback?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`
      );
    } catch (error) {
      console.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth-failed`);
    }
  }
);

// Debug endpoint to check configuration
router.get('/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    googleCallback: PROD_GOOGLE_CALLBACK,
    githubCallback: PROD_GITHUB_CALLBACK,
    googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set',
    githubClientId: process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Not set',
    nodeEnv: process.env.NODE_ENV
  });
});

module.exports = router;