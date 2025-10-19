// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");
const auth = require("../middleware/auth");
const sendEmail = require("../utils/mailer");

// 📩 1. Nieuwe aanvraag aanmaken
router.post("/", async (req, res) => {
  try {
    const { name, email, message, companyId } = req.body;

    if (!name || !email || !message || !companyId) {
      return res.status(400).json({ error: "Ontbrekende gegevens." });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden." });
    }

    // Aanvraag opslaan
    const newRequest = new Request({
      name,
      email,
      message,
      companyId,
      status: "Nieuw",
      date: new Date(),
    });
    await newRequest.save();

    // 📧 E-mailnotificatie versturen
    try {
      await sendEmail({
        to: company.email,
        subject: `Nieuwe aanvraag via Irisje.nl van ${name}`,
        html: `
          <h2>Nieuwe aanvraag ontvangen</h2>
          <p><strong>Naam:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Bericht:</strong> ${message}</p>
          <p>Bekijk alle aanvragen in je dashboard op <a href="https://irisje.nl/dashboard.html">Irisje.nl</a>.</p>
        `,
      });
      console.log(`📨 Notificatie verstuurd naar ${company.email}`);
    } catch (mailErr) {
      console.error("❌ Fout bij versturen e-mail:", mailErr);
    }

    res.status(201).json({ message: "Aanvraag opgeslagen en e-mail verzonden." });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij opslaan aanvraag." });
  }
});

// 🧩 2. Alle aanvragen van het ingelogde bedrijf ophalen
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.id;
    const requests = await Request.find({ companyId }).sort({ date: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen." });
  }
});

module.exports = router;
