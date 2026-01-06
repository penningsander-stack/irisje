// backend/routes/publicCategories.js
const express = require("express");
const router = express.Router();
const Category = require("../models/category");

/**
 * GET /api/publicCategories
 * Retourneert actieve categorieën met specialismen
 */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("value label specialties")
      .sort({ label: 1 })
      .lean();

    return res.json({ ok: true, categories });
  } catch (err) {
    console.error("❌ publicCategories error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

module.exports = router;
