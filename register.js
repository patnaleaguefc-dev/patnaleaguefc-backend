import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import Team from "../models/Team.js";

const router = express.Router();

// email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// helper: unique code generator
function makeCode() {
  return "PLF-" + crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g., PLF-9A3C11
}

// POST /api/register
router.post("/", async (req, res) => {
  try {
    const { teamName, phone, numPlayers } = req.body;

    // server-side quick validations
    if (!teamName || !phone || !numPlayers) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ ok: false, message: "Phone must be 10 digits" });
    }
    if (numPlayers < 7 || numPlayers > 11) {
      return res.status(400).json({ ok: false, message: "Players must be 7 to 11" });
    }

    // prevent duplicates by team name
    const existing = await Team.findOne({ teamName: new RegExp(`^${teamName}$`, "i") });
    if (existing) {
      return res.status(409).json({ ok: false, code: "ALREADY", message: "This team is already registered." });
    }

    // create team in pending state
    const uniqueCode = makeCode();
    const team = await Team.create({
      teamName,
      phone,
      numPlayers,
      uniqueCode,
      paymentStatus: "pending"
    });

    // email user (optional phone-only flow -> we skip email to team, send to organizer)
    // Here we only notify organizer about a new registration
    await transporter.sendMail({
      from: `"P.League FC" <${process.env.EMAIL_USER}>`,
      to: process.env.ORGANIZER_EMAIL,
      subject: `New Registration: ${teamName}`,
      html: `
        <h3>New Team Registered</h3>
        <p><b>Team:</b> ${teamName}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Players:</b> ${numPlayers}</p>
        <p><b>Unique Code:</b> ${uniqueCode}</p>
        <p>Status: <b>Pending Payment</b></p>
      `
    });

    return res.json({
      ok: true,
      team: {
        id: team._id,
        teamName: team.teamName,
        uniqueCode: team.uniqueCode,
        paymentStatus: team.paymentStatus
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// GET /api/teams (public list)
router.get("/list", async (_req, res) => {
  const teams = await Team.find({}, { teamName: 1, paymentStatus: 1, createdAt: 1 }).sort({ createdAt: -1 });
  return res.json({ ok: true, teams });
});

// Optional admin rename endpoint to edit a team name later with token
// POST /api/register/admin/rename
router.post("/admin/rename", async (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ ok: false, message: "Missing names" });
  const team = await Team.findOneAndUpdate({ teamName: oldName }, { teamName: newName }, { new: true });
  if (!team) return res.status(404).json({ ok: false, message: "Team not found" });
  return res.json({ ok: true, team });
});

export default router;
