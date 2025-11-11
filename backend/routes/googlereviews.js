// backend/routes/googleReviews.js
const express = require("express");
require("dotenv").config();

const router = express.Router();

// ✅ Universele fetch fallback (Render-compatibel)
let fetchFn;
if (typeof fetch !== "undefined") {
  fetchFn = fetch;
} else {
  fetchFn = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
}

/**
 * Route: /api/google-reviews?name=Loodgieter%20Jan&city=Amsterdam
 * Haalt publieke Google Reviews op voor een bedrijf op basis van naam + plaats.
 */
router.get("/", async (req, res) => {
  try {
    const { name, city } = req.query;
    if (!name || !city) {
      return res.status(400).json({
        ok: false,
        error: "Bedrijfsnaam en plaats zijn verplicht.",
      });
    }

    // Gebruik specifieke sleutel of fallback
    const apiKey =
      process.env.GOOGLE_REVIEWS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: "Geen Google API-sleutel ingesteld op de server.",
      });
    }

    const query = encodeURIComponent(`${name} ${city}`);

    // 1️⃣ Zoek de juiste plaats-ID (taal: NL)
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&language=nl&region=NL&key=${apiKey}`;
    const findResp = await fetchFn(findUrl);
    const findData = await findResp.json();

    if (findData.status !== "OK" || !findData.candidates?.length) {
      console.warn("⚠️ Geen locatie gevonden:", findData);
      return res.status(404).json({
        ok: false,
        error: `Geen locatie gevonden (status: ${findData.status || "onbekend"})`,
        details: findData.error_message || null,
      });
    }

    const placeId = findData.candidates[0].place_id;

    // 2️⃣ Haal details + reviews op in het Nederlands
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&language=nl&region=NL&key=${apiKey}`;
    const detailsResp = await fetchFn(detailsUrl);
    const detailsData = await detailsResp.json();

    if (detailsData.status !== "OK") {
      console.warn("⚠️ Google Places-fout:", detailsData);
      return res.status(400).json({
        ok: false,
        error: `Google Places-fout (status: ${detailsData.status})`,
        details: detailsData.error_message || null,
      });
    }

    const result = detailsData.result || {};

    // 3️⃣ Antwoord netjes formatteren
    return res.json({
      ok: true,
      name: result.name || name,
      rating: result.rating || null,
      total: result.user_ratings_total || 0,
      reviews: Array.isArray(result.reviews) ? result.reviews : [],
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen Google Reviews:", err);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij ophalen Google Reviews",
      details: err.message,
    });
  }
});

module.exports = router;
