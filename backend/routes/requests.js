// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");
const { verifyToken } = require("../middleware/auth");

// 📋 Aanvragen ophalen (alle, inclusief openbare)
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user?.id;

    // Haal zowel gekoppelde aanvragen (voor dit bedrijf) als niet-gekoppelde (openbare) op
    const requests = await Request.find({
      $or: [
        { company: companyId },    // aanvragen specifiek voor dit bedrijf
        { company: null },         // openbare aanvragen
      ],
    })
      .sort({ date: -1 })
      .lean();

    res.json(requests);
  } catch (error) {
    console.error("Fout bij ophalen aanvragen:", error);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

// 📦 Aanvraagstatus bijwerken
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Aanvraag niet gevonden" });
    }

    request.status = status;
    await request.save();

    res.json({ message: "Status bijgewerkt", request });
  } catch (error) {
    console.error("Fout bij updaten status:", error);
    res.status(500).json({ message: "Serverfout bij updaten status" });
  }
});

module.exports = router;
