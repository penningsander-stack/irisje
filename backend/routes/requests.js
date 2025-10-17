// backend/routes/requests.js
const express = require("express");
const Company = require("../models/Company");
const Request = require("../models/Request");

const router = express.Router();

// ✅ Nieuwe aanvraag aanmaken (publieke route)
router.post("/create", async (req, res) => {
  try {
    const { company, name, email, message } = req.body;

    // Basisvalidatie
    if (!company || !name || !email || !message) {
      return res.status(400).json({ error: "Alle velden zijn verplicht." });
    }

    // Zoek het bedrijf op naam
    const targetCompany = await Company.findOne({ name: company });
    if (!targetCompany) {
      return res.status(404).json({ error: "Bedrijf niet gevonden." });
    }

    // Aanvraag opslaan in database
    const newRequest = await Request.create({
      companyId: targetCompany._id,
      name,
      email,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    console.log(`📩 Nieuwe aanvraag ontvangen voor ${company} van ${name}`);

    return res.json({
      success: true,
      message: "Aanvraag succesvol verzonden.",
      id: newRequest._id,
    });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij indienen aanvraag." });
  }
});

module.exports = router;
