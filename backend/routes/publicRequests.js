// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/request");

// Nieuwe aanvraag
router.post("/", async (req, res) => {
  try {
    const { sector, city } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await Request.create({
      sector,
      city: city || "",
    });

    res.json({ requestId: request._id });
  } catch (err) {
    res.status(500).json({ error: "Serverfout" });
  }
});

// Aanvraag ophalen
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }
    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
