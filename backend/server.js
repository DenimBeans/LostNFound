const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;      // SendGrid API key
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL; // Email address to send from

// Debug: Log if MongoDB connection string loaded successfully
console.log('🔍 Connection string loaded:', MONGO_URI ? 'Yes ✅' : 'No ❌');
if (MONGO_URI) {
  console.log('First 8 chars:', MONGO_URI.substring(0, 8), '...');
}

// ==================== DATABASE CONNECTION ====================
// Connect to MongoDB database
// Skip auto-connection during tests (tests manage their own DB connection)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);  // Exit if database connection fails
    });
} else {
  console.log('⏭️  Skipping DB connection (test environment)');
}

// ==================== EMAIL CONFIGURATION ====================
// Configure SendGrid for email delivery (using Web API, not SMTP)
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Helper function to send emails
const sendEmail = async (to, subject, html) => {
  const msg = {
    to: to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: subject,
    html: html
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid error:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    return false;
  }
};

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
  resetPasswordExpires: { type: Date },                               // When reset token expires
  trackedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }], // Items user is tracking
  notifications: { type: [String], default: [] }
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
    enum: ['lost', 'found', 'pending', 'claimed', 'returned'],  // Only these 5 values allowed
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
itemSchema.index({ userId: 1, createdAt: -1 });  // Optimize user item queries
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
    const verificationUrl = `${BASE_URL}/verify/${verificationToken}`;

    // Try to send verification email
    try {
      await sendEmail(
        email,
        'Verify Your Email - Lost & Found',
        `
          <h1>Welcome ${firstName}!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link expires in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
        `
      );
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
    await sendEmail(
      email,
      'Verify Your Email - Lost & Found',
      `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `
    );

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
    const resetUrl = `${BASE_URL}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      'Password Reset - Lost & Found',
      `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `
    );

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

// ==================== ACCOUNT MANAGEMENT ENDPOINTS ====================

// EDIT ACCOUNT ENDPOINT - Update user account information
// PATCH /api/users/:userId
// Body: { firstName, lastName, email, currentPassword, newPassword }
// Response: { success, message, user, error }
app.patch('/api/users/:userId', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Prepare update object
    const updates = {};

    // Update basic info if provided
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();

    // Handle email change
    if (email && email.toLowerCase() !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        error = 'Email already in use';
        return res.status(400).json({ error });
      }

      updates.email = email.toLowerCase();
      updates.isVerified = false;  // Require re-verification for new email

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      updates.verificationToken = verificationToken;
      updates.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

      // Send verification email to new address
      const verificationUrl = `${BASE_URL}/api/auth/verify/${verificationToken}`;
      try {
        await sendEmail(
          email,
          'Verify Your New Email - Lost & Found',
          `
            <h1>Email Change Verification</h1>
            <p>Hi ${user.firstName},</p>
            <p>You recently changed your email address. Please verify your new email by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
            <p>If you did not make this change, please contact support immediately.</p>
          `
        );
      } catch (emailError) {
        console.error('Verification email error:', emailError.message);
      }
    }

    // Handle password change
    if (newPassword) {
      // Require current password for security
      if (!currentPassword) {
        error = 'Current password required to change password';
        return res.status(400).json({ error });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        error = 'Current password is incorrect';
        return res.status(401).json({ error });
      }

      // Hash and update password
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    // Apply updates to user
    Object.assign(user, updates);
    await user.save();

    // Return user without sensitive fields
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    var ret = {
      success: true,
      message: email && email.toLowerCase() !== user.email
        ? 'Account updated. Please verify your new email address.'
        : 'Account updated successfully',
      user: userResponse,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Edit account error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// DELETE ACCOUNT ENDPOINT - Permanently delete user account
// DELETE /api/users/:userId
// Potential Body: { password, confirmDelete } - Here for potential extra security (other things commented out in here align with it)
// Response: { success, message, error }
app.delete('/api/users/:userId', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;
    /*const { password, confirmDelete } = req.body;

    // Require password confirmation for security
    if (!password) {
      error = 'Password required to delete account';
      return res.status(400).json({ error });
    }

    // Require explicit confirmation
    if (!confirmDelete || confirmDelete !== true) {
      error = 'Must confirm account deletion';
      return res.status(400).json({ error });
    }*/

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Verify password
    /*const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      error = 'Incorrect password';
      return res.status(401).json({ error });
    }*/

    // Delete all items posted by user
    await Item.deleteMany({ userId: userId });

    // Remove user from other users' tracked items
    await User.updateMany(
      { trackedItems: userId },
      { $pull: { trackedItems: userId } }
    );

    // Delete user account
    await User.findByIdAndDelete(userId);

    // Send confirmation email
    try {
      await sendEmail(
        user.email,
        'Account Deleted - Lost & Found',
        `
          <h1>Account Deleted</h1>
          <p>Hi ${user.firstName},</p>
          <p>Your Lost & Found account has been successfully deleted.</p>
          <p>All your personal data has been removed from our system.</p>
          <p>If you did not request this deletion, please contact support immediately.</p>
        `
      );
    } catch (emailError) {
      console.error('Deletion confirmation email error:', emailError.message);
    }

    var ret = {
      success: true,
      message: 'Account deleted successfully',
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Delete account error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// GET USER PROFILE ENDPOINT - View Your Own Account Settings No edits
// GET /api/users/:userId
// Response: { user, error }
app.get('/api/users/:userId', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      error = 'Invalid user ID format';
      return res.status(400).json({ error });
    }

    // Find user by ID, exclude sensitive fields
    const user = await User.findById(userId).select('-password -verificationToken -resetPasswordToken -verificationTokenExpires -resetPasswordExpires');

    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Return user profile without sensitive data
    var ret = {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Get user profile error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// ==================== ITEM ENDPOINTS ====================

// CREATE ITEM ENDPOINT - Report a lost or found item
// POST /api/items
// Body: { title, description, category, imageUrl, lat, lng, locationText, lostAt, userId }
// Response: { success, message, itemId, error }
app.post('/api/items', async (req, res) => {
  var error = '';

  try {
    const {
      title,
      description,
      category,
      imageUrl,
      lat,
      lng,
      locationText,
      lostAt,
      userId,
      reporterName,
      reporterEmail
    } = req.body;

    // Validate required fields
    if (!title || !description || !userId) {
      error = 'Title, description, and userId required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    // Build location object for database
    var itemLocation = { type: 'Point', coordinates: [] };  // Default empty
    // Validate GPS coordinates if provided
    if (lat !== undefined && lng !== undefined) {  // ← CORRECT! Using AND
      // Validate coordinate ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        error = 'Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180';
        var ret = { error: error };
        return res.status(400).json(ret);
      }

      // GeoJSON format: [longitude, latitude]
      itemLocation = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }

    // Create item
    const item = await Item.create({
      title, // Item title
      description,  // Item description
      category: category || 'Other', // Default category if not provided
      location: itemLocation, // GeoJSON location
      locationText: locationText || '',// Optional textual location
      imageUrl: imageUrl || '', // Optional image URL
      lostAt: lostAt || new Date(), // Default to now if not provided
      status: 'lost',// Default status
      userId: userId || null,// Reference to user who reported
      reporterName: reporterName || '',// Optional reporter name
      reporterEmail: reporterEmail || '', // Optional reporter email
      isClaimed: false
    });

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

// GET NEARBY ITEMS ENDPOINT - Find items near a location
// GET /api/items/nearby?lat=28.6024&lng=-81.2003&radius=5
// Query: lat, lng, radius (km, default 5)
// Response: { results, count, error }
app.get('/api/items/nearby', async (req, res) => {
  var error = '';

  try {
    const { lat, lng, radius } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      error = 'Latitude and longitude required';
      var ret = { error: error };
      return res.status(400).json(ret);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 5;  // Default 5km

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      error = 'Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180';
      return res.status(400).json({ error });
    }

    // Calculate degree ranges (1 degree ≈ 111km)
    const latRange = radiusKm / 111;
    const lngRange = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    // Find items within bounding box using GeoJSON coordinates
    // coordinates[0] = longitude, coordinates[1] = latitude
    const items = await Item.find({
      'location.coordinates.1': {
        $gte: latitude - latRange,
        $lte: latitude + latRange
      },
      'location.coordinates.0': {
        $gte: longitude - lngRange,
        $lte: longitude + lngRange
      },
      status: { $nin: ['returned', 'claimed'] }    // Exclude returned items and claimed items
    })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate exact distances using Haversine formula
    const itemsWithDistance = items
      .map(item => {
        // Check if item has valid coordinates
        if (item.location &&
          item.location.coordinates &&
          item.location.coordinates.length === 2) {

          const itemLng = item.location.coordinates[0];
          const itemLat = item.location.coordinates[1];

          // Haversine formula for great-circle distance
          const R = 6371; // Earth radius in km
          const dLat = (itemLat - latitude) * Math.PI / 180;
          const dLng = (itemLng - longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) *
            Math.cos(itemLat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return {
            ...item.toObject(),
            distance: Math.round(distance * 100) / 100  // Round to 2 decimals
          };
        }

        // Item has no valid coordinates
        return { ...item.toObject(), distance: null };
      })
      .filter(item => item.distance === null || item.distance <= radiusKm)  // Filter by radius
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));  // Sort by distance

    var ret = {
      results: itemsWithDistance,
      count: itemsWithDistance.length,
      searchLocation: { latitude, longitude },
      radiusKm: radiusKm,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Nearby search error:', err);
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
    if (!status || !['lost', 'found', 'pending', 'claimed', 'returned'].includes(status)) {
      error = 'Invalid status. Must be: lost, found, pending, claimed, or returned';
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
    if (!item) { // Return 404 if item doesn't exist
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

  } catch (err) {// Handle errors
    console.error('Status update error:', err);
    error = err.message;
    var ret = { error: error };
    res.status(500).json(ret);
  }
});

// EDIT ITEM ENDPOINT
// PATCH /api/items/:id
// Body: { title, description, category, locationText, status }
app.patch('/api/items/:id', async (req, res) => {
  var error = '';
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id; // Prevent changing item ID
    delete updateData.userId; // Prevent changing item owner
    delete updateData.createdAt; // Prevent manual timestamp changes
    delete updateData.updatedAt; // Prevent manual timestamp changes
    delete updateData.__v; // Mongoose version key
    delete updateData.isClaimed; // Prevent changing claimed status
    // Add more fields to exclude as necessary
    const item = await Item.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');
    // If item not found
    if (!item) {
      error = 'Item not found';
      return res.status(404).json({ error });
    }
    // Return success response with updated item
    res.json({
      success: true,
      message: 'Item updated successfully',
      item: item,
      error: ''
    });
  } catch (err) {// Handle errors
    console.error('Edit item error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// DELETE ITEM ENDPOINT
// DELETE /api/items/:id
// Response: { success, message, error }
app.delete('/api/items/:id', async (req, res) => {
  var error = '';
  // Find item by ID and delete
  try {
    const item = await Item.findByIdAndDelete(req.params.id);// If item not found
    if (!item) {// Return 404 if item doesn't exist
      error = 'Item not found';
      return res.status(404).json({ error });
    }
    res.json({// Return success response
      success: true,
      message: 'Item deleted successfully',
      error: ''
    });
  } catch (err) {// Handle errors
    console.error('Delete item error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// TRACK ITEM ENDPOINT - Add Item to User's Tracked List
// POST /api/users/:userId/tracked-items/:itemId
// Response: { success, message, trackedItems, error }
app.post('/api/users/:userId/tracked-items/:itemId', async (req, res) => {
  var error = '';

  try {
    const { userId, itemId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      error = 'Item not found';
      return res.status(404).json({ error });
    }

    // Check if already tracking
    if (user.trackedItems.includes(itemId)) {
      error = 'Item already tracked';
      return res.status(400).json({ error });
    }

    // Add to tracked items
    user.trackedItems.push(itemId);
    await user.save();

    var ret = {
      success: true,
      message: 'Item added to tracked list',
      trackedItems: user.trackedItems,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Track item error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// REMOVE TRACKED ITEM ENDPOINT - Remove item from user's tracked list (KAN-67)
// DELETE /api/users/:userId/tracked-items/:itemId
// Response: { success, message, trackedItems, error }
app.delete('/api/users/:userId/tracked-items/:itemId', async (req, res) => {
  var error = '';

  try {
    const { userId, itemId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Remove from tracked items
    user.trackedItems = user.trackedItems.filter(
      id => id.toString() !== itemId
    );
    await user.save();

    var ret = {
      success: true,
      message: 'Item removed from tracked list',
      trackedItems: user.trackedItems,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Remove tracked item error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// GET TRACKED ITEMS ENDPOINT - Retrieve all items user is tracking (KAN-64)
// GET /api/users/:userId/tracked-items
// Response: { results, count, error }
app.get('/api/users/:userId/tracked-items', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;

    // Find user and populate tracked items with full item details
    const user = await User.findById(userId)
      .populate({
        path: 'trackedItems',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    var ret = {
      results: user.trackedItems,
      count: user.trackedItems.length,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Get tracked items error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// GET USER'S OWN ITEMS ENDPOINT - Retrieve all items posted by a specific user (KAN-50)
// GET /api/users/:userId/items
// Query Params: status (optional) - filter by item status
// Response: { results, count, error }
app.get('/api/users/:userId/items', async (req, res) => {
  var error = '';
  
  try {
    const { userId } = req.params;
    const { status } = req.query;  // Optional status filter

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      error = 'Invalid user ID format';
      return res.status(400).json({ error });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Build filter - find all items created by this user
    var filter = { userId: userId };
    
    // Add optional status filter
    if (status && ['lost', 'found', 'pending', 'claimed', 'returned'].includes(status)) {
      filter.status = status;
    }

    // Query database for items created by this user
    const items = await Item.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });  // Newest items first

    // Return items array with count
    var ret = {
      results: items,
      count: items.length,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Get user items error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// ==================== NOTIFICATION ENDPOINTS ====================

// ADD NOTIFICATION ENDPOINT - Add a new notification for a user
// POST /api/users/:userId/notifications
// Body: { message }
// Response: { success, message, notifications, error }
app.post('/api/users/:userId/notifications', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string') {
      error = 'Notification message required';
      return res.status(400).json({ error });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Add notification
    user.notifications.push(message);
    await user.save();

    var ret = {
      success: true,
      message: 'Notification added',
      notifications: user.notifications,
      error: ''
    };
    res.status(201).json(ret);

  } catch (err) {
    console.error('Add notification error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// GET NOTIFICATIONS ENDPOINT - Retrieve all notifications for a user
// GET /api/users/:userId/notifications
// Response: { notifications, count, error }
app.get('/api/users/:userId/notifications', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;

    // Find user by ID
    const user = await User.findById(userId).select('notifications');

    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    var ret = {
      notifications: user.notifications,
      count: user.notifications.length,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Get notifications error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// DELETE NOTIFICATION ENDPOINT - Remove a specific notification
// DELETE /api/users/:userId/notifications/:notificationIndex
// Response: { success, message, notifications, error }
app.delete('/api/users/:userId/notifications/:notificationIndex', async (req, res) => {
  var error = '';

  try {
    const { userId, notificationIndex } = req.params;
    const index = parseInt(notificationIndex);

    // Validate index is a number
    if (isNaN(index) || index < 0) {
      error = 'Invalid notification index';
      return res.status(400).json({ error });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    // Check if index exists
    if (index >= user.notifications.length) {
      error = 'Notification not found';
      return res.status(404).json({ error });
    }

    // Remove notification at index
    user.notifications.splice(index, 1);
    await user.save();

    var ret = {
      success: true,
      message: 'Notification deleted successfully',
      notifications: user.notifications,
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Delete notification error:', err);
    error = err.message;
    res.status(500).json({ error });
  }
});

// DELETE ALL NOTIFICATIONS ENDPOINT - Clear all notifications for a user
// DELETE /api/users/:userId/notifications
// Response: { success, message, error }
app.delete('/api/users/:userId/notifications', async (req, res) => {
  var error = '';

  try {
    const { userId } = req.params;

    // Find user and clear notifications
    const user = await User.findById(userId);
    if (!user) {
      error = 'User not found';
      return res.status(404).json({ error });
    }

    user.notifications = [];
    await user.save();

    var ret = {
      success: true,
      message: 'All notifications cleared',
      error: ''
    };
    res.json(ret);

  } catch (err) {
    console.error('Clear notifications error:', err);
    error = err.message;
    res.status(500).json({ error });
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
// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(`📧 Email configured:`, SENDGRID_API_KEY ? 'Yes ✅' : 'No ❌');
  });
}

// Export app for testing
module.exports = app;