// server.js — Lost & Found API (CommonJS)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

/* ------------------------ Middleware ------------------------ */
app.use(cors());
app.use(express.json());

/* -------------------- Environment Vars ---------------------- */
const MONGO_URI   = process.env.MONGO_URI;
const PORT        = process.env.PORT || 4000;
const JWT_SECRET  = process.env.ACCESS_TOKEN_SECRET || 'fallback_secret';
const NODE_ENV    = process.env.NODE_ENV || 'development';
const BASE_URL    = process.env.BASE_URL || `http://localhost:${PORT}`;
const EMAIL_USER  = process.env.EMAIL_USER;
const EMAIL_PASS  = process.env.EMAIL_PASSWORD;

// Debug
console.log('🔍 Connection string loaded:', MONGO_URI ? 'Yes ✅' : 'No ❌');
if (MONGO_URI) console.log('First 8 chars:', MONGO_URI.substring(0, 8), '...');

/* -------------------- MongoDB Connection -------------------- */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/* -------------------- Email (Nodemailer) -------------------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

/* ------------------------ Schemas --------------------------- */
// User schema (with trackedItems + notifications)
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:  { type: String, required: true },

    // Email verification + password reset
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // PM requested
    trackedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    notifications: { type: [String], default: [] }
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

// Item schema (with claimerId + GeoJSON + consistent statuses)
const itemSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    category:    { type: String, required: true },

    status: {
      type: String,
      enum: ['lost', 'pending', 'found', 'claimed', 'returned'],
      default: 'lost',
      required: true
    },

    // GeoJSON location: [lng, lat]
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },

    // Relations
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // reporter/owner
    claimerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // PM requested

    // Optional metadata
    locationText: { type: String, default: '' },
    lostAt:       { type: Date, default: Date.now },
    imageUrl:     { type: String, default: '' },
    isClaimed:    { type: Boolean, default: false }
  },
  { timestamps: true }
);
itemSchema.index({ location: '2dsphere' });
const Item = mongoose.model('Item', itemSchema);

/* --------------------- Utility Endpoints -------------------- */
app.get('/', (_req, res) => {
  res.json({ message: '📦 Lost and Found API is running ✅', version: '1.0.0', environment: NODE_ENV });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy', timestamp: new Date().toISOString() });
});

/* ----------------- Authentication Endpoints ----------------- */
// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      firstName, lastName, email,
      password: hashed,
      isVerified: false,
      verificationToken: token,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    const verifyUrl = `${BASE_URL}/api/auth/verify/${token}`;
    try {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Lost & Found',
        html: `<h1>Welcome ${firstName}!</h1>
               <p>Please verify your email by clicking the link below:</p>
               <a href="${verifyUrl}">Verify Email</a>
               <p>This link expires in 24 hours.</p>`
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (e) {
      console.error('❌ Email send error:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: user._id,
      error: ''
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify email
app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully! You can now log in.', error: '' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Resend verification
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email already verified' });

    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const url = `${BASE_URL}/api/auth/verify/${token}`;
    await transporter.sendMail({
      from: EMAIL_USER, to: email, subject: 'Verify Your Email - Lost & Found',
      html: `<h1>Email Verification</h1><p>Click the link to verify:</p><a href="${url}">Verify Email</a>`
    });

    res.json({ success: true, message: 'Verification email resent. Please check your inbox.', error: '' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email before logging in' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id, email: user.email, firstName: user.firstName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      accessToken: token,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      error: ''
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Always success (don’t leak existence)
      return res.json({ success: true, message: 'If email exists, password reset link has been sent', error: '' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1h
    await user.save();

    const url = `${BASE_URL}/api/auth/reset-password/${token}`;
    await transporter.sendMail({
      from: EMAIL_USER, to: email, subject: 'Password Reset - Lost & Found',
      html: `<h1>Password Reset</h1><p>Click to reset:</p><a href="${url}">Reset Password</a><p>Valid for 1 hour.</p>`
    });

    res.json({ success: true, message: 'If email exists, password reset link has been sent', error: '' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset password
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password required' });

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful! You can now log in with your new password.', error: '' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ----------------------- Item Endpoints --------------------- */
// Create item
app.post('/api/items', async (req, res) => {
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
      userId
    } = req.body;

    if (!title || !description || !userId) {
      return res.status(400).json({ error: 'Title, description, and userId required' });
    }

    // Build GeoJSON location if lat/lng provided
    let itemLocation = { type: 'Point', coordinates: [0, 0] };
    if (lat !== undefined && lng !== undefined) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ error: 'Invalid coordinates. Latitude: -90..90, Longitude: -180..180' });
      }
      itemLocation = { type: 'Point', coordinates: [lngNum, latNum] }; // [lng, lat]
    }

    const item = await Item.create({
      title,
      description,
      category: category || 'Other',
      status: 'lost',
      userId,
      location: itemLocation,
      locationText: locationText || '',
      imageUrl: imageUrl || '',
      lostAt: lostAt ? new Date(lostAt) : new Date(),
      isClaimed: false
    });

    res.status(201).json({ success: true, message: 'Item report created', itemId: item._id, error: '' });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Nearby search (GeoJSON $near)
// GET /api/items/nearby?lat=28.6024&lng=-81.2003&radiusKm=5
app.get('/api/items/nearby', async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.query;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    const latitude = Number(lat);
    const longitude = Number(lng);
    const km = Number(radiusKm) || 5;

    const items = await Item.find({
      location: {
        $near: {
          $geometry:  { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: km * 1000
        }
      }
    })
      .populate('userId', 'firstName lastName email')
      .populate('claimerId', 'firstName lastName email')
      .limit(100);

    res.json({ results: items, count: items.length, searchLocation: { latitude, longitude }, radiusKm: km, error: '' });
  } catch (err) {
    console.error('Nearby search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all items (optional filters)
app.get('/api/items', async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const items = await Item.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('claimerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ results: items, count: items.length, error: '' });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get item by id
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('claimerId', 'firstName lastName email');

    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item, error: '' });
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update item status (matches schema enums)
app.patch('/api/items/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['lost', 'pending', 'found', 'claimed', 'returned'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, message: 'Status updated', item, error: '' });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Edit item (guard protected fields)
app.patch('/api/items/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    // strip protected fields
    delete updateData._id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.isClaimed;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('userId', 'firstName lastName email')
      .populate('claimerId', 'firstName lastName email');

    if (!item) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Item updated successfully', item, error: '' });
  } catch (err) {
    console.error('Edit item error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, message: 'Item deleted successfully', error: '' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Claim item (PM requested claimerId)
app.patch('/api/items/:id/claim', async (req, res) => {
  try {
    const { claimerId } = req.body;
    if (!claimerId) return res.status(400).json({ error: 'claimerId required' });

    const claimer = await User.findById(claimerId);
    if (!claimer) return res.status(404).json({ error: 'Claimer user not found' });

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'claimed', claimerId, isClaimed: true },
      { new: true }
    )
      .populate('userId', 'firstName lastName email')
      .populate('claimerId', 'firstName lastName email');

    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Track & notify (optional but useful)
    if (!claimer.trackedItems.some(id => id.equals(item._id))) {
      claimer.trackedItems.push(item._id);
    }
    claimer.notifications.push(`You claimed: ${item.title} (${item._id})`);
    await claimer.save();

    res.json({ success: true, message: 'Item claimed', item, error: '' });
  } catch (err) {
    console.error('Claim item error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------- Error Handlers ---------------------- */
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ------------------------ Start Server ---------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`📧 Email configured:`, EMAIL_USER ? 'Yes ✅' : 'No ❌');
});