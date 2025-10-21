// backend/routes/seed.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Review = require("../models/review");

router.post("/seed", async (req, res) => {
  try {
    const companyId = "68f4c355ab9e361a51d29acd";

    // 🧹 Eerst oude testdata verwijderen
    await Request.deleteMany({ companyId });
    await Review.deleteMany({ companyId });

    // 📬 Testaanvragen
    const requests = await Request.insertMany([
      {
        companyId,
        name: "Jan de Vries",
        email: "jan@example.com",
        message: "Ik heb interesse in jullie diensten.",
        status: "Nieuw",
        date: new Date("2025-10-10"),
      },
      {
        companyId,
        name: "Petra Jansen",
        email: "petra@example.com",
        message: "Kunnen jullie mij morgen bellen?",
        status: "Geaccepteerd",
        date: new Date("2025-10-12"),
      },
    ]);

    // 💬 Testreviews
    const reviews = await Review.insertMany([
      {
        companyId,
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        date: new Date("2025-10-05"),
      },
      {
        companyId,
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        date: new Date("2025-10-08"),
      },
    ]);

    res.json({
      success: true,
      requestsCount: requests.length,
      reviewsCount: reviews.length,
      message: "✅ Seed succesvol uitgevoerd",
    });
  } catch (err) {
    console.error("❌ Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout", details: err.message });
  }
});

module.exports = router;
