// backend/routes/seed.js
const express = require("express");
const router = express.Router();

const Review = require("../models/review");
const Request = require("../models/Request");
const Company = require("../models/Company");

router.get("/", async (req, res) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ error: "Geen bedrijf gevonden om aan te koppelen." });
    }

    // Oude data wissen
    await Review.deleteMany({});
    await Request.deleteMany({});

    // Fake reviews
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
      {
        companyId: company._id,
        name: "Tom Willems",
        rating: 5,
        message: "Topservice, ik ben erg tevreden.",
        date: new Date(),
      },
    ];

    // Fake aanvragen
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
      {
        companyId: company._id,
        name: "Henk de Groot",
        email: "henk@example.com",
        message: "Ik wil graag een offerte ontvangen.",
        status: "Nieuw",
        date: new Date(),
      },
    ];

    await Review.insertMany(fakeReviews);
    await Request.insertMany(fakeRequests);

    res.json({ success: true, message: "Fake data succesvol toegevoegd aan bedrijf", companyId: company._id });
  } catch (err) {
    console.error("Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout", details: err.message });
  }
});

module.exports = router;
