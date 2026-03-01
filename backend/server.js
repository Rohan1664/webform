const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

// Load environment variables - THIS MUST COME FIRST
dotenv.config();

// Debug: Log environment variables (without secrets)
console.log('🔍 Server Environment Check:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('  GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('  BACKEND_URL:', process.env.BACKEND_URL || 'http://localhost:5000');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');

// NOW import passport AFTER env vars are loaded
const passport = require('./config/passport');

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const formRoutes = require('./routes/form.routes');
const submissionRoutes = require('./routes/submission.routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Initialize Express app
const app = express();

// Rate limiting (disable for serverless or configure appropriately)
if (process.env.NODE_ENV !== 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
}

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug middleware to log all requests to auth routes
app.use('/api/auth', (req, res, next) => {
  console.log(`🔐 Auth Route Accessed: ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Dynamic Forms API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      forms: '/api/forms',
      submissions: '/api/submissions',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📝 Registered Passport Strategies:`, Object.keys(passport._strategies));
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🔗 Backend URL: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}\n`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
  });
}

module.exports = app;