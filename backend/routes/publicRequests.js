// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");
const { sendMail } = require("../utils/mailer");

// 📩 Nieuwe offerteaanvraag ontvangen
router.post("/", async (req, res) => {
  try {
    const { companySlug, company, companyId, name, email, city, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Ontbrekende velden" });
    }

    // Probeer bedrijf op te zoeken met slug of ID (optioneel)
    let companyDoc = null;
    if (companySlug) companyDoc = await Company.findOne({ slug: companySlug });
    if (!companyDoc && (company || companyId)) companyDoc = await Company.findById(company || companyId);

    // Nieuwe aanvraag opslaan (ook zonder gekoppeld bedrijf toegestaan)
    const newRequest = new Request({
      company: companyDoc ? companyDoc._id : null,
      name,
      email,
      city,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    await newRequest.save();

    // ✅ E-mails versturen
    await sendMail({
      to: email,
      subject: "Bevestiging van je aanvraag via Irisje.nl",
      text: `Beste ${name},

We hebben je aanvraag ontvangen en sturen deze binnenkort door naar geschikte bedrijven.

Je bericht:
"${message}"

Met vriendelijke groet,
Het team van Irisje.nl`,
      html: `
        <p>Beste ${name},</p>
        <p>We hebben je aanvraag ontvangen en sturen deze binnenkort door naar geschikte bedrijven.</p>
        <p><b>Je bericht:</b><br>${message}</p>
        <p>Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
      `,
    });

    await sendMail({
      to: "info@irisje.nl",
      subject: "Nieuwe aanvraag via Irisje.nl",
      text: `Nieuwe aanvraag ontvangen van ${name} (${email})\n\nBericht: ${message}`,
      html: `
        <p><b>Nieuwe aanvraag ontvangen</b></p>
        <p><b>Naam:</b> ${name}<br>
           <b>E-mail:</b> ${email}<br>
           <b>Plaats:</b> ${city || "-"}<br>
           <b>Bericht:</b> ${message}</p>
      `,
    });

    res.json({ message: "✅ Aanvraag succesvol verzonden!", request: newRequest });
  } catch (error) {
    console.error("Fout bij versturen aanvraag:", error);
    res.status(500).json({ message: "Serverfout bij versturen aanvraag" });
  }
});

// 📋 Alle aanvragen ophalen
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
