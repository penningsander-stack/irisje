// backend/routes/meta.js

const express = require("express");
const router = express.Router();

const { getCategories } = require("../config/categories");

// GET /api/meta/categories
router.get("/categories", (req, res) => {
  return res.json({
    ok: true,
    categories: getCategories(),
  });
});

module.exports = router;
