const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const items = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json({ ok: true, items });
  } catch (err) {
    console.error("Fout bij ophalen aanvragen:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Request.findOneAndUpdate(
      { _id: req.params.id, company: req.user.id },
      { status },
      { new: true }
    );
    if (!item) return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });
    res.json({ ok: true, item });
  } catch (err) {
    console.error("Fout bij updaten status:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij updaten status" });
  }
});

module.exports = router;
