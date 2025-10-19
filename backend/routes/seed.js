// backend/routes/seed.js
const express = require("express");
const router = express.Router();

const Review = require("../models/review");
const Request = require("../models/Request");
const Company = require("../models/Company");

router.get("/", async (req, res) => {
  try {
    // 1️⃣ Zoek je echte Demo Bedrijf op
    const company = await Company.findOne({ email: "demo@irisje.nl" });

    if (!company) {
      return res.status(404).json({ error: "Demo Bedrijf niet gevonden in database." });
    }

    // 2️⃣ Oude testdata wissen
    await Review.deleteMany({ companyId: company._id });
    await Request.deleteMany({ companyId: company._id });

    // 3️⃣ Nieuwe fake aanvragen
    const fakeRequests = [
      {
        companyId: company._id,
        name: "Peter Janssen",
        email: "peter@example.com",
        message: "Ik zoek hulp bij mijn tuinproject.",
        status: "Nieuw",
        date: new Date(),
      },
      {
        companyId: company._id,
        name: "Lisa van Dijk",
        email: "lisa@example.com",
        message: "Kunnen jullie iets doen aan mijn lekkende dakgoot?",
        status: "Nieuw",
        date: new Date(),
      },
    ];

    // 4️⃣ Nieuwe fake reviews
    const fakeReviews = [
      {
        companyId: company._id,
        name: "Jan de Vries",
        rating: 5,
        message: "Snelle reactie en goed geholpen!",
        date: new Date(),
      },
      {
        companyId: company._id,
        name: "Sophie Bakker",
        rating: 4,
        message: "Klantvriendelijk en professioneel.",
        date: new Date(),
      },
    ];

    await Request.insertMany(fakeRequests);
    await Review.insertMany(fakeReviews);

    res.json({
      success: true,
      message: "Fake data toegevoegd aan Demo Bedrijf",
      company: company.name,
      companyId: company._id,
      requests: fakeRequests.length,
      reviews: fakeReviews.length,
    });
  } catch (err) {
    console.error("Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout", details: err.message });
  }
});

module.exports = router;
