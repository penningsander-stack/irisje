// backend/routes/seed.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");

const router = express.Router();

/**
 * GET /api/seed/demo
 * Maakt een demogebruiker aan (email: demo@irisje.nl, wachtwoord: demo1234)
 */
router.get("/demo", async (req, res) => {
  try {
    const email = "demo@irisje.nl";

    // Controleer of gebruiker al bestaat
    let user = await User.findOne({ email });
    if (!user) {
      const hash = await bcrypt.hash("demo1234", 10);
      user = new User({
        email,
        passwordHash: hash,
        role: "company",
        isActive: true,
      });
      await user.save();
      console.log("✅ Gebruiker toegevoegd:", email);
    }

    // Controleer of bedrijf al bestaat
    let company = await Company.findOne({ email });
    if (!company) {
      company = new Company({
        name: "Demo Bedrijf",
        email,
        category: "Algemeen",
        user: user._id,
      });
      await company.save();
      console.log("🏢 Bedrijf toegevoegd:", company.name);
    }

    return res.json({
      message: "✅ Demo-account succesvol aangemaakt!",
      email,
      password: "demo1234",
    });
  } catch (err) {
    console.error("❌ Seed-fout:", err);
    return res.status(500).json({ error: "Seed-fout: " + err.message });
  }
});

module.exports = router;
