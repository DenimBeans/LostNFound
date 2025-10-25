const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
// Middleware to enable Cross-Origin Resource Sharing (allows frontend to call API)
app.use(cors());
// Middleware to parse incoming JSON requests
app.use(express.json());

// ==================== ENVIRONMENT VARIABLES ====================
// Load configuration from .env file
const MONGO_URI = process.env.MONGO_URI;                    // MongoDB connection string
const PORT = process.env.PORT || 4000;                      // Server port (default 4000)
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback_secret';  // Secret for JWT tokens
const NODE_ENV = process.env.NODE_ENV || 'development';     // Environment (development/production)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;      // Base URL for email links
const EMAIL_USER = process.env.EMAIL_USER;                  // Gmail address for sending emails
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;          // Gmail app password

// Debug: Log if MongoDB connection string loaded successfully
console.log('🔍 Connection string loaded:', MONGO_URI ? 'Yes ✅' : 'No ❌');
if (MONGO_URI) {
  console.log('First 8 chars:', MONGO_URI.substring(0, 8), '...');
}

// ==================== DATABASE CONNECTION ====================
// Connect to MongoDB database
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);  // Exit if database connection fails
  });

// ==================== EMAIL CONFIGURATION ====================
// Configure nodemailer to send emails via Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,      // Gmail address
    pass: EMAIL_PASSWORD   // Gmail app password (NOT regular password)
  }
});

// ==================== DATABASE SCHEMAS ====================

// USER SCHEMA - Defines structure of user documents in MongoDB
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },           // User's first name
  lastName: { type: String, required: true, trim: true },            // User's last name
  email: {                                                           // User's email (unique)
    type: String, 
    required: true, 
    unique: true,        // No duplicate emails allowed
    trim: true,          // Remove whitespace
    lowercase: true      // Store as lowercase
  },
  password: { type: String, required: true },                        // Hashed password (never plain text!)
  isVerified: { type: Boolean, default: false },                     // Email verification status
  verificationToken: { type: String },                               // Token for email verification link
  verificationTokenExpires: { type: Date },                          // When verification token expires
  resetPasswordToken: { type: String },                              // Token for password reset link
  resetPasswordExpires: { type: Date }                               // When reset token expires
}, { timestamps: true });  // Automatically add createdAt and updatedAt fields

// Create User model from schema
const User = mongoose.model('User', userSchema);

// ITEM SCHEMA - Defines structure of lost/found item documents in MongoDB
const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },                           // Item name (e.g., "Lost iPhone")
  description: { type: String, required: true },                     // Item description
  category: { type: String, required: true },                        // Category (e.g., "Electronics")
  status: {                                                          // Item status
    type: String, 
    enum: ['lost', 'found', 'pending'],  // Only these 3 values allowed
    default: 'lost',                     // Default to 'lost'
    required: true 
  },
  location: {                                                        // Geographic location
    type: { type: String, default: 'Point' },                       // GeoJSON type
    coordinates: [Number]  // [longitude, latitude] for map display
  },
  userId: {                                                          // Reference to user who posted item
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',           // Links to User model
    required: true 
  },
  imageUrl: { type: String },                                        // URL to item photo (optional)
  isClaimed: { type: Boolean, default: false }                       // Whether item has been claimed
}, { timestamps: true });  // Automatically add createdAt and updatedAt fields

// Create Item model from schema
const Item = mongoose.model('Item', itemSchema);

// ==================== UTILITY ENDPOINTS ====================

// ROOT ENDPOINT - Returns API information
// GET /
app.get('/', (req, res) => {
  res.json({ 
    message: '📦 Lost and Found API is running ✅',
    version: '1.0.0',
    environment: NODE_ENV
  });
});

// HEALTH CHECK ENDPOINT - Used to verify server is running
// GET /health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// REGISTER ENDPOINT - Create new user account and send verification email
// POST /api/auth/register
// Body: { firstName, lastName, email, password }
// Response: { success, message, userId, error }
app.post('/api/auth/register', async (req, res) => {
  var error = '';
  
  try {
    // Extract user data from request body
    const { firstName, lastName, email, password } = req.body;
    
    // Validate: Check if all required fields are provided
    if (!firstName || !lastName || !email || !password) {
      error = 'All fields required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      error = 'User already exists';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Hash password for security (never store plain text passwords!)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate random verification token (32 bytes = 64 hex characters)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create new user in database
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,  // User must verify email before logging in
      verificationToken: verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000  // Token expires in 24 hours
    });

    // Create verification URL that user will click in email
    const verificationUrl = `${BASE_URL}/api/auth/verify/${verificationToken}`;
    
    // Try to send verification email
    try {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Lost & Found',
        html: `
          <h1>Welcome ${firstName}!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link expires in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
        `
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      // If email fails, log error but still create user
      console.error('❌ Email send error:', emailError.message);
    }

    // Return success response
    var ret = {
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: user._id,
      error: ''
    };
    res.status(201).json(ret);

  } catch (err) {
    console.error('Register error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// VERIFY EMAIL ENDPOINT - Verify user's email address
// GET /api/auth/verify/:token
// Response: { success, message, error }
app.get('/api/auth/verify/:token', async (req, res) => {
  var error = '';
  
  try {
    // Extract token from URL parameter
    const { token } = req.params;

    // Find user with this token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }  // $gt = greater than (not expired)
    });

    // If no user found or token expired
    if (!user) {
      error = 'Invalid or expired verification token';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Mark user as verified and clear verification token
    user.isVerified = true;
    user.verificationToken = undefined;          // Remove token
    user.verificationTokenExpires = undefined;   // Remove expiration
    await user.save();

    // Return success response
    var ret = {
      success: true,
      message: 'Email verified successfully! You can now log in.',
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Verify error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// RESEND VERIFICATION EMAIL ENDPOINT - Send new verification email if first one expired
// POST /api/auth/resend-verification
// Body: { email }
// Response: { success, message, error }
app.post('/api/auth/resend-verification', async (req, res) => {
  var error = '';
  
  try {
    // Extract email from request body
    const { email } = req.body;

    // Validate: Email is required
    if (!email) {
      error = 'Email required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      error = 'User not found';
      var ret = { error: error };
      return res.status(404).json(ret);
    }

    // Check if email is already verified
    if (user.isVerified) {
      error = 'Email already verified';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;  // New 24 hour expiration
    await user.save();

    // Create new verification URL
    const verificationUrl = `${BASE_URL}/api/auth/verify/${verificationToken}`;
    
    // Send new verification email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Lost & Found',
      html: `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `
    });

    // Return success response
    var ret = {
      success: true,
      message: 'Verification email resent. Please check your inbox.',
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Resend verification error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// LOGIN ENDPOINT - Authenticate user and return JWT token
// POST /api/auth/login
// Body: { email, password }
// Response: { success, accessToken, userId, firstName, lastName, error }
app.post('/api/auth/login', async (req, res) => {
  var error = '';
  
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Validate: Both email and password required
    if (!email || !password) {
      error = 'Email and password required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      error = 'Invalid email or password';  // Don't reveal if email exists (security)
      var ret = { error: error };
      return res.status(401).json(ret);
    }

    // Check if email is verified
    if (!user.isVerified) {
      error = 'Please verify your email before logging in';
      var ret = { error: error };
      return res.status(403).json(ret);
    }

    // Verify password (compare hashed password with input)
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      error = 'Invalid email or password';
      var ret = { error: error };
      return res.status(401).json(ret);
    }

    // Generate JWT token for authentication (valid for 24 hours)
    const token = jwt.sign(
      { userId: user._id, email: user.email, firstName: user.firstName },  // Payload
      JWT_SECRET,                                                           // Secret key
      { expiresIn: '24h' }                                                  // Expiration
    );

    // Return success response with token
    var ret = {
      success: true,
      accessToken: token,        // Frontend stores this for authenticated requests
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Login error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// FORGOT PASSWORD ENDPOINT - Request password reset email
// POST /api/auth/forgot-password
// Body: { email }
// Response: { success, message, error }
app.post('/api/auth/forgot-password', async (req, res) => {
  var error = '';
  
  try {
    // Extract email from request body
    const { email } = req.body;

    // Validate: Email is required
    if (!email) {
      error = 'Email required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Security: Always return success even if email doesn't exist (prevents email enumeration)
    if (!user) {
      var ret = {
        success: true,
        message: 'If email exists, password reset link has been sent',
        error: ''
      };
      return res.json(ret);
    }

    // Generate password reset token (random 32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000;  // Token expires in 1 hour
    await user.save();

    // Create password reset URL
    const resetUrl = `${BASE_URL}/api/auth/reset-password/${resetToken}`;
    
    // Send password reset email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: 'Password Reset - Lost & Found',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    // Return generic success message (security: don't reveal if email exists)
    var ret = {
      success: true,
      message: 'If email exists, password reset link has been sent',
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Forgot password error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// RESET PASSWORD ENDPOINT - Reset user's password with token
// POST /api/auth/reset-password/:token
// Body: { newPassword }
// Response: { success, message, error }
app.post('/api/auth/reset-password/:token', async (req, res) => {
  var error = '';
  
  try {
    // Extract token from URL and new password from body
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate: New password is required
    if (!newPassword) {
      error = 'New password required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Find user with this reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }  // Token must not be expired
    });

    // If no user found or token expired
    if (!user) {
      error = 'Invalid or expired reset token';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Hash new password and update user
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;       // Clear reset token
    user.resetPasswordExpires = undefined;     // Clear expiration
    await user.save();

    // Return success response
    var ret = {
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Reset password error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// ==================== ITEM ENDPOINTS ====================

// CREATE ITEM ENDPOINT - Report a lost or found item
// POST /api/items
// Body: { title, description, category, location, userId }
// Response: { success, message, itemId, error }
app.post('/api/items', async (req, res) => {
  var error = '';
  
  try {
    // Extract item data from request body
    const { title, description, category, location, userId } = req.body;
    
    // Validate: Title, description, and userId are required
    if (!title || !description || !userId) {
      error = 'Title, description, and userId required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Create new item in database
    const item = await Item.create({
      title,
      description,
      category: category || 'Other',  // Default category if not provided
      status: 'lost',                 // New items default to 'lost' status
      userId,
      location: location || { type: 'Point', coordinates: [0, 0] }  // Default location if not provided
    });

    // Return success response
    var ret = {
      success: true,
      message: 'Item report created',
      itemId: item._id,
      error: ''
    };
    res.status(201).json(ret);

  } catch (err) {
    console.error('Create item error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// GET ALL ITEMS ENDPOINT - Retrieve all items with optional filters
// GET /api/items?status=lost&category=Electronics
// Query Params: status (optional), category (optional)
// Response: { results, count, error }
app.get('/api/items', async (req, res) => {
  var error = '';
  
  try {
    // Extract optional filter parameters from query string
    const { status, category } = req.query;
    
    // Build filter object for MongoDB query
    var filter = {};
    if (status) filter.status = status;        // Filter by status if provided
    if (category) filter.category = category;  // Filter by category if provided
    
    // Query database with filters, populate user info, sort by newest first
    const items = await Item.find(filter)
      .populate('userId', 'firstName lastName email')  // Include user details
      .sort({ createdAt: -1 });                       // Newest items first
    
    // Return items array with count
    var ret = {
      results: items,
      count: items.length,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Get items error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// GET ITEM BY ID ENDPOINT - Retrieve specific item details
// GET /api/items/:id
// Response: { item, error }
app.get('/api/items/:id', async (req, res) => {
  var error = '';
  
  try {
    // Find item by ID and populate user info
    const item = await Item.findById(req.params.id)
      .populate('userId', 'firstName lastName email');
    
    // If item not found
    if (!item) {
      error = 'Item not found';
      var ret = { error: error };
      return res.status(404).json(ret);
    }
    
    // Return item details
    var ret = {
      item: item,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Get item error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// UPDATE ITEM STATUS ENDPOINT - Change item status (lost -> pending -> found)
// PATCH /api/items/:id/status
// Body: { status }
// Response: { success, message, item, error }
app.patch('/api/items/:id/status', async (req, res) => {
  var error = '';
  
  try {
    // Extract new status from request body
    const { status } = req.body;
    
    // Validate: Status must be one of the allowed values
    if (!status || !['lost', 'pending', 'found'].includes(status)) {
      error = 'Invalid status. Must be: lost, pending, or found';
      var ret = { error: error };
      return res.status(400).json(ret);
    }
    
    // Find item by ID and update status, return updated document
    const item = await Item.findByIdAndUpdate(
      req.params.id, 
      { status },          // Update object
      { new: true }        // Return updated document (not old one)
    );
    
    // If item not found
    if (!item) {
      error = 'Item not found';
      var ret = { error: error };
      return res.status(404).json(ret);
    }
    
    // Return success response with updated item
    var ret = {
      success: true,
      message: 'Status updated',
      item: item,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Status update error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// ==================== ERROR HANDLERS ====================

// 404 HANDLER - Catch all undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// GLOBAL ERROR HANDLER - Catch any unhandled errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================
// Start Express server and listen for requests
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`📧 Email configured:`, EMAIL_USER ? 'Yes ✅' : 'No ❌');
});