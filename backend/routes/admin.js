const express = require("express");
const router = express.Router();
router.get("/reports", (_req, res) => res.json({ ok: true, reports: [] }));
module.exports = router;
