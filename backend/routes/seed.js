const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Review = require("../models/review");
const Request = require("../models/Request");
const Company = require("../models/Company");

router.get("/", async (req, res) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ error: "Geen bedrijf gevonden om te koppelen." });
    }

    await Review.deleteMany({});
    await Request.deleteMany({});

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

    await Review.insertMany(fakeReviews);
    await Request.insertMany(fakeRequests);

    res.json({ success: true, message: "Fake data succesvol toegevoegd." });
  } catch (err) {
    console.error("Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout", details: err.message });
  }
});

module.exports = router;
