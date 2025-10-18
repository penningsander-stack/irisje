// backend/routes/seed.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");

const router = express.Router();

/**
 * GET /api/seed/fixdemo
 * Herstelt de demogebruiker en maakt hem opnieuw aan met het juiste wachtwoord.
 */
router.get("/fixdemo", async (req, res) => {
  try {
    const email = "demo@irisje.nl";
    const plainPassword = "demo1234";

    // verwijder eventueel oude versies
    await User.deleteMany({ email });
    await Company.deleteMany({ email });

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      email,
      passwordHash,
      role: "company",
      isActive: true,
    });
    await user.save();

    const company = new Company({
      name: "Demo Bedrijf",
      email,
      category: "Algemeen",
      user: user._id,
    });
    await company.save();

    console.log("✅ Nieuw demo-account aangemaakt");
    res.json({
      message: "Demo-account hersteld.",
      email,
      password: plainPassword,
    });
  } catch (err) {
    console.error("❌ Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout: " + err.message });
  }
});

module.exports = router;
