// backend/routes/importer_places.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Company = require("../models/ompany");
require("dotenv").config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DEFAULT_OWNER = "690a3dcd10e1cc45c456bc73"; // jouw bestaande admin/eigenaar id

if (!API_KEY) {
  console.warn("⚠️ Geen GOOGLE_PLACES_API_KEY gevonden in .env — importer werkt niet zonder.");
}

// belangrijkste NL-steden
const CITIES = [
  "Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven","Tilburg","Groningen","Breda",
  "Nijmegen","Arnhem","Haarlem","Leiden","Zwolle","Leeuwarden","Alkmaar","Amersfoort",
  "Apeldoorn","Middelburg","Gouda","Dordrecht"
];

// simpele slugify
function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

// 1) alle resultaten per stad ophalen (met pagetoken)
async function fetchPlacesForCity(city) {
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

    // Google wil ±2s wachten voor de volgende pagina
    if (pageToken) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  } while (pageToken && results.length < 60);

  console.log(`📄 ${city}: ${results.length} resultaten`);
  return results;
}

// 2) details per place_id (voor telefoon/website)
async function fetchPlaceDetails(placeId) {
  if (!placeId) return {};
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("fields", "formatted_phone_number,website,url");

  const { data } = await axios.get(url.toString());
  if (data.status !== "OK") return {};
  return data.result || {};
}

// 🚀 batch-importer
router.get("/batch", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "Geen Google API key gevonden" });
  }

  const MAX_IMPORT = 500; // veilige marge
  let imported = 0;
  const addedExamples = [];
  const errors = [];

  try {
    for (const city of CITIES) {
      if (imported >= MAX_IMPORT) break;

      const places = await fetchPlacesForCity(city);

      // door alle gevonden kantoren in deze stad
      for (const place of places) {
        if (imported >= MAX_IMPORT) break;

        const name = place.name?.trim();
        if (!name) continue;

        // bestond dit bedrijf al in deze stad?
        const exists = await Company.findOne({ name, city });
        if (exists) continue;

        // extra details ophalen (telefoon/website)
        let details = {};
        try {
          details = await fetchPlaceDetails(place.place_id);
        } catch (e) {
          // niet fataal
        }

        // unieke email op basis van place_id (dan krijg je geen E11000)
        const fallbackEmail = place.place_id
          ? `noemail_${place.place_id}@irisje.nl`
          : `noemail_${Date.now()}${Math.floor(Math.random() * 9999)}@irisje.nl`;

        // slug uniek maken met stad erbij (minder kans op botsing)
        const baseSlug = slugify(name);
        const finalSlug = city ? `${baseSlug}-${slugify(city)}` : baseSlug;

        try {
          await Company.create({
            name,
            slug: finalSlug,
            tagline: `Advocatenkantoor in ${city}`,
            description: `Advocatenkantoor in ${city}, gespecialiseerd in juridisch advies en bijstand.`,
            categories: ["Advocaat"],
            city,
            address: place.formatted_address || "",
            phone: details.formatted_phone_number || "",
            email: fallbackEmail,
            website: details.website || details.url || place.website || "",
            avgRating: typeof place.rating === "number" ? place.rating : 0,
            reviewCount: typeof place.user_ratings_total === "number" ? place.user_ratings_total : 0,
            isVerified: true,
            owner: DEFAULT_OWNER,
          });

          imported++;
          if (addedExamples.length < 10) addedExamples.push(name);
        } catch (err) {
          errors.push({
            name,
            city,
            error: err.message,
          });
        }
      }
    }

    return res.json({
      ok: true,
      imported,
      addedExamples,
      totalCities: CITIES.length,
      message: `Import afgerond: ${imported} advocaten toegevoegd`,
      // alleen de eerste 10 fouten teruggeven
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("❌ Importfout:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
