// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

// ========================
// REGISTER
// ========================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Vul alle velden in." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Gebruiker bestaat al." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    res.status(201).json({ ok: true, message: "Account aangemaakt" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Serverfout bij registreren" });
  }
});

// ========================
// LOGIN
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Ongeldige inloggegevens" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Ongeldige inloggegevens" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 👇 BELANGRIJK VOOR RENDER (cross-origin HTTPS)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,       // verplicht bij https
      sameSite: "none",   // verplicht bij verschillende domeinen
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dagen
    });

    res.json({ ok: true, user: { id: user._id, name: user.name, email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// ========================
// LOGOUT
// ========================
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.json({ ok: true, message: "Uitgelogd" });
});

// ========================
// AUTH CHECK (voor dashboard)
// ========================
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Niet ingelogd" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      lastLogin: user.updatedAt || new Date(),
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(401).json({ error: "Ongeldige of verlopen sessie" });
  }
});

// ========================
// PING (voor health-check)
// ========================
router.get("/ping", (req, res) => {
  res.json({ ok: true, service: "auth" });
});

module.exports = router;
