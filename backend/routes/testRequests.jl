const express = require("express");
const router = express.Router();
router.get("/", (_req, res) => res.json({ ok: true, message: "testRequests ok" }));
module.exports = router;
