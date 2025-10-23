
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import itemRoutes from "./routes/itemRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

console.log("🔍 Connection string loaded:", MONGO_URI ? "Yes ✅" : "No ❌");
if (MONGO_URI) {
  console.log("First 8 chars:", MONGO_URI.substring(0, 8), "...");
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

app.get("/", (req, res) => {
  res.send("📦 Lost and Found API is running ✅");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
