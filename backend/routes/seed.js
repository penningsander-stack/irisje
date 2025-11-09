// backend/routes/seed.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Company = require("../models/company"); // ✅ correcte kleine letters

const router = express.Router();

// Alleen gebruiken in development of test
router.get("/seed-companies", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Seeden is uitgeschakeld in productieomgeving" });
    }

    const filePath = path.join(__dirname, "../seed/companies.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "companies.json niet gevonden" });
    }

    const companies = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const dummyOwnerId = new mongoose.Types.ObjectId();

    const prepared = companies.map((c, i) => ({
      ...c,
      owner: c.owner || dummyOwnerId,
      isVerified: true,
      avgRating: c.avgRating || 0,
      reviewCount: c.reviewCount || 0,
      email:
        c.email && c.email.trim() !== ""
          ? c.email.trim()
          : `noemail_${i}@irisje.nl`,
    }));

    await Company.deleteMany({});
    await Company.insertMany(prepared);

    console.log(`✅ ${prepared.length} bedrijven succesvol toegevoegd (met dummy-owner + unieke e-mails).`);
    res.json({ ok: true, count: prepared.length });
  } catch (err) {
    console.error("❌ Fout bij seeden:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
