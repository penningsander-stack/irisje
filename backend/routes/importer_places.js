// backend/routes/importer_places.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Company = require("../models/Company");
require("dotenv").config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ Geen GOOGLE_PLACES_API_KEY gevonden in .env — importer werkt niet zonder.");
}

// 🏙️ Belangrijkste steden in NL
const CITIES = [
  "Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven","Tilburg","Groningen","Breda",
  "Nijmegen","Arnhem","Haarlem","Leiden","Zwolle","Leeuwarden","Alkmaar","Amersfoort",
  "Apeldoorn","Middelburg","Gouda","Dordrecht"
];

// 🔁 Ophalen met next_page_token-ondersteuning
async function fetchPlaces(city) {
  let results = [];
  let pageToken = null;

  do {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", `advocaat in ${city}`);
    url.searchParams.set("type", "lawyer");
    url.searchParams.set("key", API_KEY);
    if (pageToken) url.searchParams.set("pagetoken", pageToken);

    const { data } = await axios.get(url.toString());
    if (data.results?.length) results.push(...data.results);
    pageToken = data.next_page_token || null;

    // Google eist kleine pauze voor next_page_token
    if (pageToken) await new Promise((r) => setTimeout(r, 2000));
  } while (pageToken && results.length < 60); // max ±60 per stad

  console.log(`📄 ${city}: ${results.length} advocaten gevonden`);
  return results;
}

// 🚀 Batch-importer
router.get("/batch", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "Geen Google API key gevonden" });

  let imported = 0;
  const added = [];
  const errors = [];

  try {
    for (const city of CITIES) {
      if (imported >= 500) break; // veiligheidslimiet
      const places = await fetchPlaces(city);

      for (const place of places) {
        if (imported >= 500) break;

        const name = place.name?.trim();
        if (!name) continue;

        const exists = await Company.findOne({ name, city });
        if (exists) continue;

        try {
          await Company.create({
            name,
            slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, ""),
            tagline: `Advocatenkantoor in ${city}`,
            categories: ["Advocaat"],
            city,
            phone: place.formatted_phone_number || "",
            email: `noemail_${Math.floor(Math.random() * 100000)}@irisje.nl`,
            website: place.website || place.url || "",
            avgRating: 0,
            reviewCount: 0,
            isVerified: true,
            owner: "690a3dcd10e1cc45c456bc73",
          });
          imported++;
          added.push(name);
        } catch (err) {
          errors.push({ name, city, error: err.message });
        }
      }
    }

    res.json({
      ok: true,
      imported,
      addedExamples: added.slice(0, 10),
      totalCities: CITIES.length,
      message: `Import afgerond: ${imported} advocaten toegevoegd`,
      errors: errors.length ? errors.slice(0, 5) : [],
    });
  } catch (err) {
    console.error("❌ Importfout:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
