// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// REGISTER (simpel; voor testen)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "Vul alle velden in." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Gebruiker bestaat al." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: role || "company" });
    await user.save();
    return res.status(201).json({ ok: true, message: "Account aangemaakt" });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ error: "Serverfout bij registreren" });
  }
});

// LOGIN (zet cookie met SameSite=None; Secure)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Ongeldige inloggegevens" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Ongeldige inloggegevens" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,      // vereist op https
      sameSite: "none",  // vereist bij verschillende domeinen
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  });
  return res.json({ ok: true, message: "Uitgelogd" });
});

// ME (cookie lezen)
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Niet ingelogd" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.updatedAt
    });
  } catch (e) {
    console.error("Me error:", e);
    return res.status(401).json({ error: "Ongeldige of verlopen sessie" });
  }
});

// PING
router.get("/ping", (req, res) => {
  res.json({ ok: true, service: "auth" });
});

module.exports = router;
