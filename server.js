import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// CORS: allow requests only from your Netlify frontend
app.use(cors({ origin: "https://patnaleaguefc.netlify.app" }));

// JSON parsing
app.use(express.json({ limit: "1mb" }));

// MongoDB connect
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "pleague",
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
connectDB();

// Safe import for routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let registerRoute, cashfreeRoute;
try {
  registerRoute = (await import(path.join(__dirname, "routes/register.js"))).default;
} catch (err) {
  console.error("❌ Could not load register route:", err.message);
}

try {
  cashfreeRoute = (await import(path.join(__dirname, "routes/cashfree.js"))).default;
} catch (err) {
  console.error("❌ Could not load cashfree route:", err.message);
}

// Only use routes if they loaded successfully
if (registerRoute) app.use("/api/register", registerRoute);
if (cashfreeRoute) app.use("/api/cashfree", cashfreeRoute);

app.get("/", (_req, res) => res.send("P-League FC backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
