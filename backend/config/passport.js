const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User.model');
const connectDB = require('./db');

// Hardcoded production URLs
const PROD_GOOGLE_CALLBACK = 'https://webform-nine.vercel.app/api/auth/google/callback';
const PROD_GITHUB_CALLBACK = 'https://webform-nine.vercel.app/api/auth/github/callback';

// Debug: Check if env vars are loaded
console.log('\n🔍 Passport Config - Environment Check:');
console.log('  GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
console.log('  GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('  GITHUB_CLIENT_ID present:', !!process.env.GITHUB_CLIENT_ID);
console.log('  GITHUB_CLIENT_SECRET present:', !!process.env.GITHUB_CLIENT_SECRET);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  Production Google Callback:', PROD_GOOGLE_CALLBACK);
console.log('  Production GitHub Callback:', PROD_GITHUB_CALLBACK);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    await connectDB();
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
try {
  console.log('\n📝 Attempting to register Google Strategy...');
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth credentials missing. Google login will not work.');
  } else {
    // Use hardcoded production URL
    const callbackURL = PROD_GOOGLE_CALLBACK;
    
    console.log('  ✅ GOOGLE_CLIENT_ID found');
    console.log('  ✅ GOOGLE_CLIENT_SECRET found');
    console.log('  📍 Callback URL configured as:', callbackURL);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await connectDB();
        
        // Get email from profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
          console.error('❌ No email provided from Google profile:', profile);
          return done(new Error('No email provided from Google'), null);
        }
        
        console.log('✅ Google profile received:', profile.id, email);
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (!user) {
          console.log('📝 Creating new user from Google profile');
          // Create new user from Google profile
          user = new User({
            email: email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            password: Math.random().toString(36).slice(-8), // Random password
            provider: 'google',
            providerId: profile.id,
            isActive: true
          });
          await user.save();
          console.log('✅ New user created:', user._id);
        } else {
          console.log('✅ Existing user found:', user._id);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('❌ Google OAuth strategy error:', error);
        return done(error, null);
      }
    }));
    console.log('✅ Google Strategy registered successfully');
  }
} catch (error) {
  console.error('❌ Failed to register Google Strategy:', error);
}

// GitHub OAuth Strategy
try {
  console.log('\n📝 Attempting to register GitHub Strategy...');
  
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.warn('⚠️ GitHub OAuth credentials missing. GitHub login will not work.');
  } else {
    // Use hardcoded production URL
    const callbackURL = PROD_GITHUB_CALLBACK;
    
    console.log('  ✅ GITHUB_CLIENT_ID found');
    console.log('  ✅ GITHUB_CLIENT_SECRET found');
    console.log('  📍 Callback URL configured as:', callbackURL);
    
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: callbackURL,
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await connectDB();
        
        // Get email from GitHub
        const email = profile.emails && profile.emails[0] ? 
                      profile.emails[0].value : 
                      `${profile.username}@github.com`;
        
        console.log('✅ GitHub profile received:', profile.id, email);
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (!user) {
          console.log('📝 Creating new user from GitHub profile');
          // Split display name into first and last name
          const nameParts = profile.displayName ? profile.displayName.split(' ') : [profile.username, ''];
          
          user = new User({
            email: email,
            firstName: nameParts[0] || profile.username,
            lastName: nameParts.slice(1).join(' ') || '',
            password: Math.random().toString(36).slice(-8),
            provider: 'github',
            providerId: profile.id,
            isActive: true
          });
          await user.save();
          console.log('✅ New user created:', user._id);
        } else {
          console.log('✅ Existing user found:', user._id);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('❌ GitHub OAuth strategy error:', error);
        return done(error, null);
      }
    }));
    console.log('✅ GitHub Strategy registered successfully');
  }
} catch (error) {
  console.error('❌ Failed to register GitHub Strategy:', error);
}

// Debug: List all registered strategies
console.log('\n📊 Registered Passport Strategies:', Object.keys(passport._strategies));
console.log('');

module.exports = passport;