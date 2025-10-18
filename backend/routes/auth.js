// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

const router = express.Router();

// Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mail en wachtwoord zijn verplicht." });

    // Gebruiker zoeken in 'users'-collectie
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Onbekende gebruiker." });

    // Wachtwoord vergelijken (passwordHash-veld)
    const geldig = await bcrypt.compare(password, user.passwordHash);
    if (!geldig)
      return res.status(400).json({ error: "Ongeldig wachtwoord." });

    // JWT-token genereren
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "irisje_secret_key_2025",
      { expiresIn: "2h" }
    );

    // Bijbehorend bedrijf zoeken (optioneel)
    const company = await Company.findOne({ email });

    res.json({
      message: "Login succesvol",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      company,
    });
  } catch (err) {
    console.error("Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// Registreren
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const bestaand = await User.findOne({ email });
    if (bestaand)
      return res.status(400).json({ error: "E-mail bestaat al." });

    const hashed = await bcrypt.hash(password, 10);
    const nieuw = await User.create({
      name,
      email,
      passwordHash: hashed,
      role: "company",
      isActive: true,
    });

    res.json({ message: "Gebruiker geregistreerd", user: nieuw });
  } catch (err) {
    console.error("Register-fout:", err);
    res.status(500).json({ error: "Serverfout bij registreren" });
  }
});

module.exports = router;
