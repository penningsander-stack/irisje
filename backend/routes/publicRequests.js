// backend/routes/publicRequests.js – FINAL WORKING VERSION (v20251208)

const express = require("express");
const router = express.Router();
const Request = require("../models/request");  // let op: lowercase bestandsnaam

// GET /api/publicRequests/popular-categories
router.get("/popular-categories", async (req, res) => {
  try {
    const results = await Request.aggregate([
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const categories = results.map(c => ({
      name: c._id,
      slug: c._id.toLowerCase().replace(/\s+/g, "-"),
      count: c.count
    }));

    res.json({ ok: true, categories });
  } catch (err) {
    console.error("popular-categories error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;
