const express = require("express");
const router = express.Router();
router.post("/", (_req, res) => res.json({ ok: true, message: "Requests seeded (stub)" }));
module.exports = router;
