// backend/routes/publicRequests.js
// v20251208-PUBLIC-CATEGORIES
//
// New endpoint:
//   GET /api/publicRequests/popular-categories
//
// Returns a list of popular categories with request counts.
// Falls back safely if no data exists.

const express = require("express");
const router = express.Router();
const Request = require("../models/Request");

router.get("/popular-categories", async (req, res) => {
  try {
    const results = await Request.aggregate([
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const categories = results.map(r => ({
      name: r._id,
      slug: r._id.toLowerCase().replace(/\s+/g, "-"),
      count: r.count
    }));

    res.json({ ok: true, categories });
  } catch (err) {
    console.error("Popular categories error:", err);
    res.status(500).json({ ok: false, message: "Server error reading categories" });
  }
});

module.exports = router;
