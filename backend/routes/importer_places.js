// backend/routes/importer_places.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const Company = require("../models/company"); // ✅ juiste pad

const router = express.Router();

// Importeer plaatsen uit JSON-bestand naar Company records
router.get("/import", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Importeren is uitgeschakeld in productie" });
    }

    const filePath = path.join(__dirname, "../seed/places.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "places.json niet gevonden" });
    }

    const places = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(places)) {
      return res.status(400).json({ error: "places.json bevat geen geldig array-formaat" });
    }

    let count = 0;
    for (const p of places) {
      const exists = await Company.findOne({ city: p.city });
      if (!exists) {
        await Company.create({
          name: p.name || "Onbekend Bedrijf",
          slug: p.slug || `bedrijf-${count + 1}`,
          tagline: p.tagline || "",
          categories: p.categories || [],
          city: p.city,
          isVerified: true,
        });
        count++;
      }
    }

    console.log(`✅ ${count} plaatsen succesvol geïmporteerd.`);
    res.json({ ok: true, count });
  } catch (err) {
    console.error("❌ Fout bij importeren plaatsen:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
