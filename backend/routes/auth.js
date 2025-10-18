// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Tijdelijke route om nieuwe hash te genereren (verwijder later weer)
router.post("/generate-hash", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Geen wachtwoord ontvangen" });

    const hash = await bcrypt.hash(password, 10);
    console.log("Nieuwe hash:", hash);
    res.json({ hash });
  } catch (err) {
    console.error("Fout bij hashen:", err);
    res.status(500).json({ error: "Serverfout bij genereren hash" });
  }
});

// ✅ Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mail en wachtwoord zijn verplicht" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    console.log("Gebruiker gevonden:", {
      email: user.email,
      heeftPassword: !!user.password,
      heeftPasswordHash: !!user.passwordHash,
    });

    // Controleer welk veld aanwezig is
    const hash = user.passwordHash || user.password;
    if (!hash) return res.status(400).json({ error: "Geen wachtwoordveld gevonden in gebruiker" });

    const geldig = await bcrypt.compare(password.trim(), hash.trim());
    if (!geldig) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "company" },
      process.env.JWT_SECRET || "geheim",
      { expiresIn: "12h" }
    );

    res.json({
      message: "Succesvol ingelogd",
      token,
      user: { id: user._id, email: user.email, name: user.name || "Bedrijf" },
    });
  } catch (err) {
    console.error("Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// ✅ Registreren (optioneel)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Alle velden zijn verplicht" });

    const bestaande = await User.findOne({ email });
    if (bestaande)
      return res.status(400).json({ error: "E-mailadres is al geregistreerd" });

    const hash = await bcrypt.hash(password, 10);
    const nieuweGebruiker = new User({
      name,
      email,
      passwordHash: hash,
      role: "company",
      isActive: true,
    });
    await nieuweGebruiker.save();

    res.json({ message: "Registratie voltooid" });
  } catch (err) {
    console.error("Registratie-fout:", err);
    res.status(500).json({ error: "Serverfout bij registreren" });
  }
});

module.exports = router;
