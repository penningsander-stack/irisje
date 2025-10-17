// backend/routes/requests.js
const express = require("express");
const Company = require("../models/Company");
const Request = require("../models/Request");
const router = express.Router();

// Nieuwe aanvraag aanmaken
router.post("/create", async (req, res) => {
  try {
    const { company, name, email, message } = req.body;
    if (!company || !name || !email || !message) {
      return res.status(400).json({ error: "Alle velden zijn verplicht." });
    }

    const target = await Company.findOne({ name: company });
    if (!target) {
      return res.status(404).json({ error: "Bedrijf niet gevonden." });
    }

    const newReq = await Request.create({
      companyId: target._id,
      name,
      email,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    res.json({ success: true, id: newReq._id });
  } catch (err) {
    console.error("Fout bij aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij indienen aanvraag." });
  }
});

module.exports = router;
