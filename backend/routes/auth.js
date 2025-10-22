// backend/routes/auth.js
// ======================================
// Irisje.nl - Authenticatie routes (stabiele Render-versie)
// ======================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// -------------------- Helper: cookie instellingen --------------------
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,             // verplicht bij HTTPS (Render)
  sameSite: "None",         // cookie delen tussen frontend/backend
  domain: ".onrender.com",  // gedeeld domein voor beide services
  path: "/",                // geldig voor alle routes
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dagen
};

// -------------------- /api/auth/login --------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Onjuiste inloggegevens" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Onjuiste inloggegevens" });
    }

    // JWT token aanmaken
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // Cookie zetten
    res.cookie("token", token, COOKIE_OPTIONS);

    // Laatste login bijwerken
    user.lastLogin = new Date();
    await user.save();

    res.json({
      ok: true,
      message: "Inloggen geslaagd",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// -------------------- /api/auth/me --------------------
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Niet ingelogd" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    res.json({ ok: true, user });
  } catch (err) {
    res.status(401).json({ error: "Ongeldige of verlopen sessie" });
  }
});

// -------------------- /api/auth/logout --------------------
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    ...COOKIE_OPTIONS,
    maxAge: 0
  });
  res.json({ ok: true, message: "Uitgelogd" });
});

// -------------------- /api/auth/ping --------------------
router.get("/ping", (req, res) => {
  res.json({ ok: true, service: "auth" });
});

module.exports = router;
