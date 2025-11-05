// backend/routes/importer_places.js
const express = require("express");
const axios = require("axios");
const Company = require("../models/Company");

const router = express.Router();
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mapGoogleResult(r) {
  return {
    name: r.name || "",
    slug: slugify(r.name + "-" + (r.place_id || "")),
    tagline: r.types ? r.types.join(", ") : "",
    categories: r.types || ["Algemeen"],
    city: r.vicinity || r.formatted_address || "",
    website: r.website || "",
    phone: r.formatted_phone_number || "",
    avgRating: r.rating || 0,
    reviewCount: r.user_ratings_total || 0,
    googlePlaceId: r.place_id,
    email: "", // Google levert geen e-mail
    isVerified: false,
  };
}

router.get("/places", async (req, res) => {
  const { keyword = "loodgieter", city = "amsterdam", limit = 10 } = req.query;

  if (!GOOGLE_KEY) return res.status(500).json({ ok: false, error: "GOOGLE_PLACES_API_KEY ontbreekt" });

  let imported = 0;
  const ops = [];
  let nextToken = null;

  try {
    do {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", `${keyword} in ${city}, Nederland`);
      url.searchParams.set("key", GOOGLE_KEY);
      if (nextToken) url.searchParams.set("pagetoken", nextToken);

      const resp = await axios.get(url.toString());
      const results = resp.data.results || [];
      nextToken = resp.data.next_page_token;

      for (const r of results) {
        const c = mapGoogleResult(r);
        if (!c.name) continue;
        if (!c.website) c.website = `https://maps.google.com/?cid=${r.place_id}`;
        if (!c.email) c.email = `auto_${r.place_id}@irisje.nl`;

        ops.push({
          updateOne: {
            filter: { googlePlaceId: c.googlePlaceId },
            update: { $set: c },
            upsert: true,
          },
        });
        imported++;
        if (imported >= limit) break;
      }

      if (nextToken && imported < limit) await sleep(2500);
    } while (nextToken && imported < limit);

    if (ops.length) await Company.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, imported });
  } catch (err) {
    console.error("Google importer error:", err.response?.data || err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
