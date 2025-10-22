// backend/routes/seed.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Request = require("../models/Request");
const Review = require("../models/review");
const Company = require("../models/Company");
const User = require("../models/User");

/**
 * Seed testdata voor demo-bedrijf (via User -> Company)
 * POST /api/seed/demo-data
 */
router.post("/demo-data", async (_req, res) => {
  try {
    // 1️⃣ Zoek de demo-user
    const user = await User.findOne({ email: "demo@irisje.nl" });
    if (!user) {
      return res.status(404).json({ ok: false, message: "Demo-user niet gevonden" });
    }

    // 2️⃣ Zoek of maak bedrijf gekoppeld aan deze user
    let company = await Company.findOne({ owner: user._id });
    if (!company) {
      company = await Company.create({
        name: "Demo Bedrijf",
        owner: user._id,
      });
    }

    // 3️⃣ Verwijder oude testdata
    await Request.deleteMany({ companyId: company._id });
    await Review.deleteMany({ companyId: company._id });

    // 4️⃣ Voeg voorbeeld-aanvragen toe
    const requests = await Request.insertMany([
      {
        name: "Jan de Vries",
        email: "jan@example.com",
        message: "Kunt u mijn tuinhek repareren?",
        status: "Nieuw",
        companyId: company._id,
      },
      {
        name: "Lisa Jansen",
        email: "lisa@example.com",
        message: "Graag hulp bij een lekkende kraan.",
        status: "Geaccepteerd",
        companyId: company._id,
      },
      {
        name: "Peter Bos",
        email: "peter@example.com",
        message: "Mijn afvoer is verstopt, kunt u komen kijken?",
        status: "Afgewezen",
        companyId: company._id,
      },
    ]);

    // 5️⃣ Voeg voorbeeld-reviews toe
    const reviews = await Review.insertMany([
      {
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        companyId: company._id,
      },
      {
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        companyId: company._id,
      },
      {
        name: "Klant C",
        rating: 3,
        message: "Redelijk tevreden, iets traag met reactie.",
        companyId: company._id,
      },
    ]);

    return res.json({
      ok: true,
      message: "Demo-data succesvol aangemaakt",
      company: company.name,
      requestsCount: requests.length,
      reviewsCount: reviews.length,
    });
  } catch (err) {
    console.error("❌ Seed error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
