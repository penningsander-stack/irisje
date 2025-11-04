// backend/routes/seed.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Company = require("../models/Company");

const router = express.Router();

router.get("/seed-companies", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../seed/companies.json");
    const companies = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // dummy user-ID voor alle bedrijven zonder eigenaar
    const dummyOwnerId = new mongoose.Types.ObjectId();

    const prepared = companies.map((c) => ({
      ...c,
      owner: c.owner || dummyOwnerId,
      isVerified: true,
      avgRating: 0,
      reviewCount: 0,
    }));

    await Company.deleteMany({});
    await Company.insertMany(prepared);

    console.log(`✅ ${prepared.length} bedrijven succesvol toegevoegd (met dummy-owner).`);
    res.json({ ok: true, count: prepared.length });
  } catch (err) {
    console.error("❌ Fout bij seeden:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
