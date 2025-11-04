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

    const dummyOwnerId = new mongoose.Types.ObjectId();

    const prepared = companies.map((c, i) => ({
      ...c,
      owner: c.owner || dummyOwnerId,
      isVerified: true,
      avgRating: 0,
      reviewCount: 0,
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
