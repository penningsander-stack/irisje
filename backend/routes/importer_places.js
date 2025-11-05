// backend/routes/importer_places.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Company = require("../models/Company");
require("dotenv").config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// 🌍 Uitgebreide juridische zoektermen
const SEARCH_TERMS = [
  "advocaat",
  "jurist",
  "rechtsbijstand",
  "juridisch advies",
  "letselschade",
  "arbeidsrecht",
  "mediator",
  "mediation"
];

// 🏙️ Grotere set steden
const CITIES = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen",
  "Enschede", "Apeldoorn", "Haarlem", "Arnhem", "Amersfoort", "Zaanstad", "Haarlemmermeer", "Zoetermeer", "Leiden", "Dordrecht",
  "Zwolle", "Ede", "Leeuwarden", "Alphen aan den Rijn", "Helmond", "Amstelveen", "Sittard", "Roosendaal", "Spijkenisse", "Gouda",
  "Hoorn", "Vlaardingen", "Purmerend", "Heerlen", "Venlo", "Middelburg", "Assen", "Emmen", "Oss", "Veenendaal", "Hilversum",
  "Tiel", "Weert", "Heerenveen", "Hengelo", "Zeist", "Harderwijk", "Zutphen", "Vlissingen", "Sneek", "Rijswijk"
];

// 🧠 Functie om data uit Places API op te halen
async function fetchPlaces(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const response = await axios.get(url);
  return response.data.results || [];
}

// 🚀 Batch import route
router.get("/batch", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "Geen Google API key gevonden" });

  let imported = 0;
  let errors = [];
  let addedCompanies = [];

  try {
    for (const term of SEARCH_TERMS) {
      for (const city of CITIES) {
        const query = `${term} in ${city}`;
        console.log("🔍 Zoeken:", query);

        const places = await fetchPlaces(query);

        for (const place of places) {
          if (imported >= 800) break; // max. 800 nieuwe bedrijven

          const name = place.name || "Onbekend bedrijf";
          const cityName = city;
          const website = place.website || (place.url ? place.url : "");
          const phone = place.formatted_phone_number || "";
          const email = `noemail_${Math.floor(Math.random() * 100000)}@irisje.nl`;

          const exists = await Company.findOne({ name, city: cityName });
          if (exists) continue;

          try {
            await Company.create({
              name,
              slug: name.toLowerCase().replace(/\s+/g, "-"),
              tagline: `${term.charAt(0).toUpperCase() + term.slice(1)} in ${cityName}`,
              description: "",
              categories: [term.charAt(0).toUpperCase() + term.slice(1)],
              city: cityName,
              phone,
              email,
              website,
              avgRating: 0,
              reviewCount: 0,
              isVerified: true,
              owner: "690a3dcd10e1cc45c456bc73" // standaard demo-owner
            });
            imported++;
            addedCompanies.push(name);
          } catch (err) {
            errors.push({ name, error: err.message });
          }
        }

        if (imported >= 800) break;
      }
      if (imported >= 800) break;
    }

    res.json({
      ok: true,
      imported,
      errors,
      addedCompanies: addedCompanies.slice(0, 10), // eerste 10 tonen als voorbeeld
      message: "Batch-import afgerond"
    });
  } catch (err) {
    console.error("❌ Fout bij batch-import:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
