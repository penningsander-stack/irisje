// backend/routes/importer_places.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Company = require("../models/Company");
require("dotenv").config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// 🏙️ Grotere set steden
const CITIES = [
  "Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven","Tilburg","Groningen","Breda",
  "Nijmegen","Arnhem","Haarlem","Leiden","Dordrecht","Zwolle","Leeuwarden","Alkmaar",
  "Amersfoort","Apeldoorn","Middelburg","Gouda","Heerlen","Venlo","Hilversum","Delft",
  "Zutphen","Assen","Roermond","Deventer","Den Bosch","Sittard","Oss","Vlaardingen",
  "Hoorn","Sneek","Rijswijk","Tiel","Veenendaal","Emmen","Helmond","Weert"
];

// 🧠 Functie om Places op te halen
async function fetchPlaces(city) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=advocaat+in+${encodeURIComponent(city)}&type=lawyer&key=${API_KEY}`;
  const response = await axios.get(url);
  return response.data.results || [];
}

// 🚀 Importroute
router.get("/batch", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "Geen Google API key gevonden" });

  let imported = 0;
  let errors = [];
  let added = [];

  try {
    for (const city of CITIES) {
      console.log("🔍 Ophalen advocaten in:", city);
      const places = await fetchPlaces(city);

      for (const place of places) {
        if (imported >= 500) break; // veiligheidslimiet

        const name = place.name || "Onbekend advocatenkantoor";
        const exists = await Company.findOne({ name, city });
        if (exists) continue;

        try {
          await Company.create({
            name,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
            tagline: `Advocatenkantoor in ${city}`,
            categories: ["Advocaat"],
            city,
            phone: place.formatted_phone_number || "",
            email: `noemail_${Math.floor(Math.random() * 100000)}@irisje.nl`,
            website: place.website || "",
            avgRating: 0,
            reviewCount: 0,
            isVerified: true,
            owner: "690a3dcd10e1cc45c456bc73"
          });
          imported++;
          added.push(name);
        } catch (err) {
          errors.push({ name, error: err.message });
        }
      }

      if (imported >= 500) break;
    }

    res.json({
      ok: true,
      imported,
      addedExamples: added.slice(0, 10),
      message: "Advocatenimport afgerond",
      errors
    });
  } catch (err) {
    console.error("❌ Fout bij import:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
