// backend/routes/seed.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Gebruik de juiste bestandsnamen zoals jij hebt
const Company = require("../models/Company");
const Request = require("../models/Request");
const Review = require("../models/review");
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    // Oude data wissen
    await Promise.all([
      Company.deleteMany({}),
      Request.deleteMany({}),
      Review.deleteMany({}),
      User.deleteMany({})
    ]);

    // Nieuw demoaccount
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const user = await User.create({
      email: "demo@irisje.nl",
      passwordHash,
      role: "company",
      isActive: true,
    });

    // Bedrijf koppelen
    const company = await Company.create({
      name: "Demo Bedrijf",
      email: "demo@irisje.nl",
      category: "Algemeen",
      phone: "0111-123456",
      address: "Voorbeeldstraat 1, Burgh-Haamstede",
      website: "https://irisje.nl",
      user: user._id,
    });

    // ✅ Belangrijk: veldnaam aangepast naar companyId
    const requests = [
      {
        name: "Jan Jansen",
        email: "jan@example.com",
        message: "Ik wil graag een offerte voor mijn klus.",
        status: "Nieuw",
        companyId: company._id,
      },
      {
        name: "Lisa de Boer",
        email: "lisa@example.com",
        message: "Kan ik een afspraak maken voor volgende week?",
        status: "Geaccepteerd",
        companyId: company._id,
      },
      {
        name: "Tom Bakker",
        email: "tom@example.com",
        message: "Niet meer nodig, bedankt.",
        status: "Afgewezen",
        companyId: company._id,
      },
    ];
    await Request.insertMany(requests);

    // Reviews koppelen (zelfde wijziging)
    const reviews = [
      {
        name: "Eva van Dijk",
        rating: 5,
        message: "Snelle reactie en vriendelijk geholpen!",
        companyId: company._id,
      },
      {
        name: "Pieter K.",
        rating: 3,
        message: "Was oké, maar had iets sneller gemogen.",
        companyId: company._id,
      },
    ];
    await Review.insertMany(reviews);

    res.json({
      message: "✅ Testdata succesvol toegevoegd",
      login: { email: "demo@irisje.nl", wachtwoord: "demo1234" },
    });
  } catch (err) {
    console.error("Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout", details: err.message });
  }
});

module.exports = router;
