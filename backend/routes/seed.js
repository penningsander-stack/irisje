// backend/routes/seed.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const Company = require("../models/Company");

const router = express.Router();

// Tijdelijke route om echte bedrijven te importeren
router.get("/seed-companies", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../seed/companies.json");
    const companies = JSON.parse(fs.readFileSync(filePath, "utf8"));

    await Company.deleteMany({});
    await Company.insertMany(companies);

    console.log(`✅ ${companies.length} bedrijven succesvol toegevoegd.`);
    res.json({ ok: true, count: companies.length });
  } catch (err) {
    console.error("❌ Fout bij seeden:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
