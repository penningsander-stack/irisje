// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const { verifyToken } = require("../middleware/auth");

// 📋 Alle aanvragen ophalen (alleen met token)
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user?.id;
    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }],
    })
      .sort({ date: -1 })
      .lean();
    res.json(requests);
  } catch (error) {
    console.error("Fout bij ophalen aanvragen:", error);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

// 📋 Aanvragen per bedrijf ophalen (open endpoint voor dashboard)
router.get("/company/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!requests) {
      return res.status(404).json({ message: "Geen aanvragen gevonden" });
    }

    res.json(requests);
  } catch (error) {
    console.error("Fout bij ophalen aanvragen per bedrijf:", error);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen per bedrijf" });
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
