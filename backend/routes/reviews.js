const express = require("express");
const router = express.Router();

router.get("/company", (req, res) => {
  res.json({ ok: true, reviews: [] });
});

module.exports = router;
