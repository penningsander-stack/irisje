// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // gebruiker met email + password
const Company = require("../models/Company"); // bedrijfsgegevens
const router = express.Router();

// Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mail en wachtwoord zijn verplicht." });

    // Controleer of gebruiker bestaat
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Onbekende gebruiker." });

    // Vergelijk wachtwoord
    const geldig = await bcrypt.compare(password, user.password);
    if (!geldig) return res.status(400).json({ error: "Ongeldig wachtwoord." });

    // Token genereren
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Bedrijfsgegevens ophalen (optioneel)
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

// Registreren (optioneel)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const bestaand = await User.findOne({ email });
    if (bestaand) return res.status(400).json({ error: "E-mail bestaat al." });

    const hashed = await bcrypt.hash(password, 10);
    const nieuw = await User.create({ name, email, password: hashed });

    res.json({ message: "Gebruiker geregistreerd", user: nieuw });
  } catch (err) {
    console.error("Register-fout:", err);
    res.status(500).json({ error: "Serverfout bij registreren" });
  }
});

module.exports = router;
