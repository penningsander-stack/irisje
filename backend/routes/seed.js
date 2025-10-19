// backend/routes/seed.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Company = require("../models/Company");
const Request = require("../models/Request");
const Review = require("../models/review");
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    await Company.deleteMany({});
    await Request.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});

    // demo-gebruiker aanmaken
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const user = new User({
      email: "demo@irisje.nl",
      passwordHash,
      role: "company",
      isActive: true,
    });
    await user.save();

    // gekoppeld bedrijf
    const company = new Company({
      name: "Demo Bedrijf",
      email: "demo@irisje.nl",
      category: "Algemeen",
      phone: "0111-123456",
      address: "Voorbeeldstraat 1, Burgh-Haamstede",
      website: "https://irisje.nl",
      user: user._id,
    });
    await company.save();

    // testaanvragen
    const requests = [
      {
        name: "Jan Jansen",
        email: "jan@example.com",
        message: "Ik wil graag een offerte voor mijn klus.",
        status: "Nieuw",
        company: company._id,
      },
      {
        name: "Lisa de Boer",
        email: "lisa@example.com",
        message: "Kan ik een afspraak maken voor volgende week?",
        status: "Geaccepteerd",
        company: company._id,
      },
      {
        name: "Tom Bakker",
        email: "tom@example.com",
        message: "Niet meer nodig, bedankt.",
        status: "Afgewezen",
        company: company._id,
      },
    ];
    await Request.insertMany(requests);

    // testreviews
    const reviews = [
      {
        name: "Eva van Dijk",
        rating: 5,
        message: "Snelle reactie en vriendelijk geholpen!",
        company: company._id,
      },
      {
        name: "Pieter K.",
        rating: 3,
        message: "Was oké, maar had iets sneller gemogen.",
        company: company._id,
      },
    ];
    await Review.insertMany(reviews);

    res.json({
      message: "✅ Testdata succesvol toegevoegd",
      login: { email: "demo@irisje.nl", wachtwoord: "demo1234" },
    });
  } catch (err) {
    console.error("Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout" });
  }
});

module.exports = router;
