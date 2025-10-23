// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: "Onbekende gebruiker" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, error: "Wachtwoord onjuist" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,               // ✅ vereist op Render (https)
      sameSite: "None",           // ✅ nodig voor cross-domain cookies
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    user.lastLogin = new Date();
    await user.save();

    res.json({
      ok: true,
      message: "Inloggen geslaagd",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij inloggen" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false, error: "Geen token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ ok: false, error: "Gebruiker niet gevonden" });

    res.json({ ok: true, user });
  } catch (err) {
    res.status(401).json({ ok: false, error: "Ongeldige sessie" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  });
  res.json({ ok: true, message: "Uitgelogd" });
});

router.get("/ping", (_req, res) => res.json({ ok: true, service: "auth" }));

module.exports = router;
