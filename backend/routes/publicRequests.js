// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");

// Publieke aanvraag
router.post("/", async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, message, companyId } = req.body;

    if (!customerName || !customerEmail || !message || !companyId) {
      return res.status(400).json({ message: "Verplichte velden ontbreken" });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Bedrijf niet gevonden" });

    const request = new Request({
      customerName,
      customerEmail,
      customerPhone,
      message,
      company: companyId,
      status: "Nieuw",
    });

    await request.save();
    res.status(201).json({ message: "Aanvraag succesvol ontvangen", request });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ message: "Serverfout bij opslaan aanvraag" });
  }
});

module.exports = router;
