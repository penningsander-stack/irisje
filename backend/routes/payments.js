const express = require("express");
const router = express.Router();
router.get("/balance", (_req, res) => res.json({ ok: true, balance: 0 }));
module.exports = router;
