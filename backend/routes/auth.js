// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const auth = require("../middleware/auth");

const router = express.Router();

// Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mail en wachtwoord zijn verplicht" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Onbekende gebruiker" });

    // Gebruik zowel 'passwordHash' als 'password'
    const hash = user.passwordHash || user.password;
    if (!hash)
      return res.status(500).json({ error: "Geen wachtwoord gevonden voor deze gebruiker" });

    const isMatch = await bcrypt.compare(password, hash);
    if (!isMatch) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    let company = await Company.findOne({ user: user._id });
    if (!company) company = await Company.findOne({ email: user.email });

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
      user: {
        id: user._id,
        email: user.email,
        name: company?.name || "Bedrijf",
      },
      companyId: company ? company._id : null,
    });
  } catch (err) {
    console.error("Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// Token-verificatie
router.get("/verify", auth, (req, res) => {
  return res.json({ valid: true, user: req.user });
});

// Info over ingelogde gebruiker
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    let company = null;
    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId).lean();
    } else if (user) {
      company = await Company.findOne({ user: user._id }).lean() ||
        await Company.findOne({ email: user.email }).lean();
    }

    res.json({
      user: user ? { id: user._id, email: user.email } : null,
      company: company || null,
    });
  } catch (err) {
    console.error("Me-fout:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
