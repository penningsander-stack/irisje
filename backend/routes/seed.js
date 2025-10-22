// backend/routes/seed.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Review = require("../models/review");
const Company = require("../models/Company");

/**
 * Seed testdata voor demo-bedrijf
 * URL: POST /api/seed/demo-data
 */
router.post("/demo-data", async (req, res) => {
  try {
    // 1️⃣ Zoek het demobedrijf
    const company = await Company.findOne({ email: "demo@irisje.nl" });
    if (!company) {
      return res.status(404).json({ ok: false, message: "Demo-bedrijf niet gevonden" });
    }

    // 2️⃣ Verwijder bestaande testdata
    await Request.deleteMany({ companyId: company._id });
    await Review.deleteMany({ companyId: company._id });

    // 3️⃣ Voeg nieuwe aanvragen toe
    const requests = await Request.insertMany([
      {
        name: "Jan de Vries",
        email: "jan@example.com",
        message: "Kunt u mijn tuinhek repareren?",
        status: "Nieuw",
        companyId: company._id,
        createdAt: new Date("2025-10-20T10:00:00Z"),
      },
      {
        name: "Lisa Jansen",
        email: "lisa@example.com",
        message: "Graag hulp bij een lekkende kraan.",
        status: "Geaccepteerd",
        companyId: company._id,
        createdAt: new Date("2025-10-21T09:30:00Z"),
      },
      {
        name: "Peter Bos",
        email: "peter@example.com",
        message: "Mijn afvoer is verstopt, kunt u komen kijken?",
        status: "Afgewezen",
        companyId: company._id,
        createdAt: new Date("2025-10-22T14:15:00Z"),
      },
    ]);

    // 4️⃣ Voeg nieuwe reviews toe
    const reviews = await Review.insertMany([
      {
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        companyId: company._id,
        createdAt: new Date("2025-10-05T12:00:00Z"),
      },
      {
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        companyId: company._id,
        createdAt: new Date("2025-10-08T15:30:00Z"),
      },
      {
        name: "Klant C",
        rating: 3,
        message: "Redelijk tevreden, iets traag met reactie.",
        companyId: company._id,
        createdAt: new Date("2025-10-10T10:45:00Z"),
      },
    ]);

    res.json({
      ok: true,
      message: "Demo-data succesvol aangemaakt",
      requestsCount: requests.length,
      reviewsCount: reviews.length,
    });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
