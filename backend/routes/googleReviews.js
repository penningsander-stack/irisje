// backend/routes/googleReviews.js
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const router = express.Router();

// Route: /api/google-reviews?name=Loodgieter%20Jan&city=Amsterdam
router.get("/", async (req, res) => {
  try {
    const { name, city } = req.query;
    if (!name || !city) {
      return res.status(400).json({ error: "Bedrijfsnaam en plaats zijn verplicht" });
    }

    const query = encodeURIComponent(`${name} ${city}`);
    const apiKey = process.env.GOOGLE_REVIEWS_API_KEY;

    // 1️⃣ Zoek de Place ID
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const findResp = await fetch(findUrl);
    const findData = await findResp.json();

    if (!findData.candidates?.length) {
      return res.status(404).json({ error: "Geen Google Place gevonden" });
    }

    const placeId = findData.candidates[0].place_id;

    // 2️⃣ Haal details en reviews op
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;
    const detailsResp = await fetch(detailsUrl);
    const detailsData = await detailsResp.json();

    return res.json({
      name: detailsData.result.name,
      rating: detailsData.result.rating,
      total: detailsData.result.user_ratings_total,
      reviews: detailsData.result.reviews || [],
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen Google Reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen Google Reviews" });
  }
});

module.exports = router;
