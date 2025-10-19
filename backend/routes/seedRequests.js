// backend/routes/seedRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const User = require("../models/User");

router.get("/demo", async (req, res) => {
  try {
    // Zoek de demo-gebruiker in de database
    const demoUser = await User.findOne({ email: "demo@irisje.nl" });
    if (!demoUser) {
      return res.status(404).json({ error: "Demo-gebruiker niet gevonden." });
    }

    // Verwijder oude testaanvragen
    await Request.deleteMany({ companyId: demoUser._id });

    // Voeg nieuwe testaanvragen toe
    const testData = [
      {
        name: "Jan de Vries",
        email: "jan@example.com",
        message: "Ik heb interesse in jullie diensten.",
        companyId: demoUser._id,
        status: "Nieuw",
        date: new Date("2025-10-10"),
      },
      {
        name: "Petra Jansen",
        email: "petra@example.com",
        message: "Kunnen jullie mij morgen bellen?",
        companyId: demoUser._id,
        status: "Geaccepteerd",
        date: new Date("2025-10-12"),
      },
    ];

    await Request.insertMany(testData);

    res.json({
      success: true,
      message: "✅ Testaanvragen toegevoegd aan database.",
      count: testData.length,
    });
  } catch (err) {
    console.error("❌ Fout bij seeden:", err);
    res.status(500).json({ error: "Seed-fout", details: err.message });
  }
});

module.exports = router;
