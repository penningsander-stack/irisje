// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* Cookies moeten gedeeld worden tussen subdomeinen bij Render */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,             // HTTPS verplicht
  sameSite: "None",         // cross-site toegestaan
  domain: ".onrender.com",  // gedeeld voor irisje-frontend.onrender.com & irisje-backend.onrender.com
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

/* POST /api/auth/login */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Vul e-mail en wachtwoord in." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Onjuiste inloggegevens" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Onjuiste inloggegevens" });

    const token = jwt.sign(
      { id: user._id, role: user.role || "company" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // minimale dataconsistentie voor oude records
    if (!user.name) user.name = "Bedrijf";
    user.lastLogin = new Date();
    await user.save().catch(e => console.warn("Kon user niet opslaan:", e?.message || e));

    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      message: "Inloggen geslaagd",
      user: { id: user._id, name: user.name, email: user.email, role: user.role || "company", lastLogin: user.lastLogin }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

/* GET /api/auth/me */
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Niet ingelogd" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    return res.json({ ok: true, user });
  } catch (err) {
    return res.status(401).json({ error: "Ongeldige of verlopen sessie" });
  }
});

/* POST /api/auth/logout */
router.post("/logout", (req, res) => {
  // zelfde cookie-params gebruiken om correct te overschrijven
  res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res.json({ ok: true, message: "Uitgelogd" });
});

/* GET /api/auth/ping */
router.get("/ping", (_req, res) => res.json({ ok: true, service: "auth" }));

module.exports = router;
