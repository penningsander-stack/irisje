// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const Request = require("../models/Request");
const { sendMail } = require("../utils/mailer");

/**
 * POST /api/publicRequests/submit
 * Publieke offerte-aanvraag voor een bedrijf
 * body: { slug or companyId, name, email, message }
 */
router.post("/submit", async (req, res) => {
  try {
    const { slug, companyId, name, email, message } = req.body || {};

    if (!name || !email || !message || (!slug && !companyId)) {
      return res.status(400).json({ ok: false, error: "Ontbrekende velden" });
    }

    // Zoek bedrijf op slug of ID
    let company = null;
    if (slug) {
      company = await Company.findOne({ slug });
    } else if (companyId) {
      company = await Company.findById(companyId);
    }

    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    // Nieuwe aanvraag opslaan
    const reqDoc = await Request.create({
      company: company._id,
      name,
      email,
      message,
      status: "Nieuw",
    });

    // Probeer e-mail te versturen
    try {
      if (company && company.website) {
        await sendMail({
          to: company.website.includes("@") ? company.website : "info@irisje.nl",
          subject: `Nieuwe aanvraag via Irisje.nl – ${company.name}`,
          html: `
            <h2>Nieuwe aanvraag via Irisje.nl</h2>
            <p><strong>Bedrijf:</strong> ${company.name}</p>
            <p><strong>Naam klant:</strong> ${name}</p>
            <p><strong>E-mail klant:</strong> ${email}</p>
            <p><strong>Bericht:</strong></p>
            <p>${message}</p>
            <hr>
            <p>Je kunt de aanvraag bekijken in je bedrijfsdashboard.</p>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("⚠️ Mailfout bij aanvraagmelding:", mailErr.message);
    }

    res.json({ ok: true, message: "Aanvraag verzonden", id: reqDoc._id });
  } catch (err) {
    console.error("publicRequests/submit error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij indienen aanvraag" });
  }
});

module.exports = router;
