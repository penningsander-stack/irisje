// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Succes: { token, user, companyId? }
 */
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail en wachtwoord zijn verplicht" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Onbekende gebruiker" });

    const hash = user.passwordHash || user.password; // compatibel met beide velden
    if (!hash) return res.status(500).json({ error: "Wachtwoord ontbreekt voor gebruiker" });

    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    // Optioneel: koppel bedrijf via e-mail of via user._id (beide geprobeerd)
    let company = await Company.findOne({ user: user._id });
    if (!company) company = await Company.findOne({ email });

    const payload = {
      id: user._id,
      email: user.email,
      companyId: company ? company._id : null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "irisje_secret_key_2025", {
      expiresIn: "12h",
    });

    return res.json({
      message: "Login succesvol",
      token,
      user: { id: user._id, email: user.email, name: user.name || "Bedrijf" },
      companyId: company ? company._id : null,
    });
  } catch (err) {
    console.error("Login-fout:", err);
    return res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

/**
 * GET /api/auth/verify
 * Header: Authorization: Bearer <token>
 * Succes: { valid: true, user: { id, email, companyId? } }
 * Fout: { valid: false }
 */
router.get("/verify", auth, async (req, res) => {
  try {
    // req.user is gezet door middleware/auth.js
    return res.json({ valid: true, user: req.user });
  } catch {
    return res.json({ valid: false });
  }
});

/**
 * GET /api/auth/me
 * Geeft actuele user + gekoppelde company terug
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    let company = null;
    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId).lean();
    } else if (user) {
      company = await Company.findOne({ user: user._id }).lean() || await Company.findOne({ email: user.email }).lean();
    }
    return res.json({
      user: user ? { id: user._id, email: user.email, name: user.name || "Bedrijf" } : null,
      company: company ? {
        _id: company._id,
        name: company.name || "",
        email: company.email || user?.email || "",
        category: company.category || "Algemeen",
      } : null,
    });
  } catch (e) {
    console.error("Me-route fout:", e);
    return res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
