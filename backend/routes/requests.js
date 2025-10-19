// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const auth = require("../middleware/auth");

// ✅ Alle aanvragen voor één bedrijf
router.get("/company/:companyId", auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    const filter = { companyId };

    if (req.query.status && req.query.status !== "Alle") {
      filter.status = req.query.status;
    }

    const requests = await Request.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Fout bij aanvragen ophalen:", err);
    res.status(500).json({ error: "Serverfout bij aanvragen ophalen" });
  }
});

// ✅ Aanvraagstatus bijwerken
router.put("/:id/status", auth, async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Aanvraag niet gevonden" });
    res.json(request);
  } catch (err) {
    console.error("Fout bij status bijwerken:", err);
    res.status(500).json({ error: "Serverfout bij status bijwerken" });
  }
});

module.exports = router;
