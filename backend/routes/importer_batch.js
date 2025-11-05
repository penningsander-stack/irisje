// backend/routes/importer_batch.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_BASE = process.env.RENDER_EXTERNAL_URL
  ? `${process.env.RENDER_EXTERNAL_URL}/api/importer/places`
  : "https://irisje-backend.onrender.com/api/importer/places";

// 🏙️ Steden en categorieën
const cities = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven",
  "Tilburg", "Groningen", "Breda", "Nijmegen", "Haarlem"
];

const categories = [
  "Loodgieter", "Elektricien", "Schoonmaakbedrijf", "Schilder", "Tegelzetter",
  "Stukadoor", "Dakdekker", "Timmerman", "Slotenmaker", "Glaszetter",
  "Autogarage", "Tandarts", "Dierenarts", "Kapper", "Fysiotherapeut",
  "Schoonheidssalon", "Notaris", "Advocaat", "Hovenier", "Installatiebedrijf"
];

// ⏳ Helper voor vertraging tussen requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🚀 Batch import uitvoeren
router.get("/", async (req, res) => {
  let importedTotal = 0;
  let errors = [];

  for (const city of cities) {
    for (const cat of categories) {
      const keyword = `${cat} ${city} Nederland`;
      const url = `${API_BASE}?keyword=${encodeURIComponent(keyword)}&limit=10`;

      try {
        const r = await axios.get(url);
        if (r.data?.ok && r.data.imported > 0) {
          console.log(`✅ ${cat} in ${city}: ${r.data.imported} toegevoegd`);
          importedTotal += r.data.imported;
        } else {
          console.log(`⚪ ${cat} in ${city}: niets toegevoegd`);
        }
      } catch (err) {
        console.error(`❌ Fout bij ${cat} in ${city}:`, err.message);
        errors.push(`${cat} - ${city}`);
      }

      await delay(1500); // 1,5 seconde wachttijd per call
    }
  }

  res.json({
    ok: true,
    imported: importedTotal,
    errors,
    message: "Batch-import afgerond",
  });
});

module.exports = router;
