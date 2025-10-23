import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  
  // Email verification fields
  verificationToken: { type: String },           // Random token sent in email link
  verificationTokenExpires: { type: Date },      // Token expires after 24 hours
  
  // Password reset fields
  resetPasswordToken: { type: String },          // Random token for reset link
  resetPasswordExpires: { type: Date }           // Token expires after 1 hour
  
}, { timestamps: true });

/*
Password Reset Flow:
1. User forgets password → requests reset
2. Email sent with reset link containing token
3. User clicks link → enters new password
4. Password updated, token cleared
*/

export default mongoose.model("User", userSchema);