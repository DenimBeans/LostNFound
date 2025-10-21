import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import itemRoutes from "./routes/itemRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

// Create app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/items", itemRoutes);

// Environment variables
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI; // ✅ Changed from MONGO_URL

// Debug: check if Mongo URI is loaded
console.log("🔍 Connection string loaded:", MONGO_URI ? "Yes ✅" : "No ❌");
if (MONGO_URI) {
  console.log("First 8 chars:", MONGO_URI.substring(0, 8), "...");
}

// Connect to MongoDB
mongoose
  .connect(MONGO_URI) // ✅ Changed from MONGO_URL
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// Basic route
app.get("/", (req, res) => {
  res.send("📦 Lost and Found API is running ✅");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});