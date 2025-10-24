// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");

// 📩 Nieuwe offerteaanvraag ontvangen
router.post("/", async (req, res) => {
  try {
    const { companySlug, name, email, message } = req.body;

    if (!companySlug || !name || !email || !message) {
      return res.status(400).json({ message: "Ontbrekende velden" });
    }

    // Zoek het bedrijf op basis van de slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ message: "Bedrijf niet gevonden" });
    }

    // Maak nieuwe aanvraag aan
    const newRequest = new Request({
      company: company._id,
      name,
      email,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    await newRequest.save();

    // Stuur bevestiging terug
    res.json({ message: "✅ Aanvraag succesvol verzonden!", request: newRequest });
  } catch (error) {
    console.error("Fout bij versturen aanvraag:", error);
    res.status(500).json({ message: "Serverfout bij versturen aanvraag" });
  }
});

// 📋 (optioneel) Alle aanvragen ophalen — handig voor test
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find().lean();
    res.json(requests);
  } catch (error) {
    console.error("Fout bij ophalen aanvragen:", error);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

module.exports = router;
