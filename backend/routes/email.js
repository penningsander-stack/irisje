const express = require("express");
const router = express.Router();
router.post("/send", (_req, res) => res.json({ ok: true, message: "Mail queued" }));
module.exports = router;
