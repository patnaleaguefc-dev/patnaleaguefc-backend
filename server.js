import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import registerRoute from "./routes/register.js";
import cashfreeRoute from "./routes/cashfree.js";

dotenv.config();

const app = express();

// CORS: allow requests only from your Netlify frontend
app.use(cors({ origin: "https://patnaleaguefc.netlify.app" }));

// JSON parsing
app.use(express.json({ limit: "1mb" }));

// MongoDB
await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB || "pleague",
});
console.log("✅ MongoDB connected");

// routes
app.use("/api/register", registerRoute);
app.use("/api/cashfree", cashfreeRoute);

app.get("/", (_req, res) => res.send("P-League FC backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
