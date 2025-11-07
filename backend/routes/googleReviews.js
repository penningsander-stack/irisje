// backend/routes/googleReviews.js
const express = require("express");
require("dotenv").config();

const router = express.Router();

// ✅ Universele fetch fallback (werkt in Node 18+ én op Render)
let fetchFn;
if (typeof fetch !== "undefined") {
  fetchFn = fetch;
} else {
  fetchFn = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
}

// Route: /api/google-reviews?name=Loodgieter%20Jan&city=Amsterdam
router.get("/", async (req, res) => {
  try {
    const { name, city } = req.query;
    if (!name || !city) {
      return res
        .status(400)
        .json({ error: "Bedrijfsnaam en plaats zijn verplicht" });
    }

    // Gebruik de review-key, maar val terug op de algemene places-key
    const apiKey =
      process.env.GOOGLE_REVIEWS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Geen Google API-sleutel ingesteld" });
    }

    const query = encodeURIComponent(`${name} ${city}`);

    // 1️⃣ Zoek Place ID
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const findResp = await fetchFn(findUrl);
    const findData = await findResp.json();

    if (findData.status !== "OK" || !findData.candidates?.length) {
      return res.status(404).json({
        error: `Geen locatie gevonden (status: ${findData.status || "onbekend"})`,
        details: findData.error_message || null,
      });
    }

    const placeId = findData.candidates[0].place_id;

    // 2️⃣ Haal details en reviews op
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;
    const detailsResp = await fetchFn(detailsUrl);
    const detailsData = await detailsResp.json();

    if (detailsData.status !== "OK") {
      return res.status(400).json({
        error: `Google Places fout (status: ${detailsData.status})`,
        details: detailsData.error_message || null,
      });
    }

    const result = detailsData.result || {};

    return res.json({
      name: result.name || name,
      rating: result.rating || null,
      total: result.user_ratings_total || 0,
      reviews: Array.isArray(result.reviews) ? result.reviews : [],
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen Google Reviews:", err);
    res
      .status(500)
      .json({ error: "Serverfout bij ophalen Google Reviews" });
  }
});

module.exports = router;
