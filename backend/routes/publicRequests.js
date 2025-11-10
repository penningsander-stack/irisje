// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer"); // 👈 toegevoegd

// ✅ Test route
router.get("/", (req, res) => {
  res.json({ ok: true, message: "publicRequests router actief" });
});

// ✅ Multi-aanvraag (max 5 bedrijven)
router.post("/multi", async (req, res) => {
  try {
    const { customerName, customerEmail, message, companies } = req.body || {};

    // 🔎 Validatie
    if (!customerName || !customerEmail || !message) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mailadres en bericht zijn verplicht.",
      });
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Kies minstens één bedrijf.",
      });
    }

    if (companies.length > 5) {
      return res.status(400).json({
        ok: false,
        error: "Je kunt maximaal 5 bedrijven selecteren.",
      });
    }

    // ✅ IDs controleren en omzetten naar ObjectId
    const objectIds = companies
      .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Ongeldige bedrijfskeuze.",
      });
    }

    const foundCompanies = await Company.find({ _id: { $in: objectIds } })
      .select("_id name email owner")
      .lean();

    if (!foundCompanies.length) {
      return res.status(404).json({
        ok: false,
        error: "Geen van de gekozen bedrijven bestaat.",
      });
    }

    // ✅ Eén aanvraag per bedrijf opslaan
    const toInsert = foundCompanies.map((c) => ({
      name: customerName,
      email: customerEmail,
      message: message || "",
      company: c._id,
      status: "Nieuw",
      date: new Date(),
    }));

    const inserted = await Request.insertMany(toInsert);

    // 📩 Console-log
    console.log(
      `📩 Nieuwe openbare aanvraag ontvangen van ${customerName} <${customerEmail}> voor bedrijven: ${foundCompanies
        .map((c) => c.name)
        .join(", ")}`
    );

    // ✉️ Automatische e-mailmelding via Brevo
    try {
      await sendMail({
        to: process.env.SMTP_FROM, // meestal info@irisje.nl
        subject: "Nieuwe aanvraag via Irisje.nl",
        html: `
          <h2>Nieuwe aanvraag via Irisje.nl</h2>
          <p><b>Naam:</b> ${customerName}</p>
          <p><b>Email:</b> ${customerEmail}</p>
          <p><b>Bericht:</b> ${message}</p>
          <p><b>Geselecteerde bedrijven:</b> ${foundCompanies
            .map((c) => c.name)
            .join(", ")}</p>
          <p>Ontvangen op: ${new Date().toLocaleString("nl-NL")}</p>
        `,
      });
      console.log("📧 E-mailmelding verzonden naar info@irisje.nl");
    } catch (mailErr) {
      console.error("⚠️ Fout bij verzenden e-mailmelding:", mailErr);
    }

    return res.json({
      ok: true,
      created: inserted.length,
    });
  } catch (err) {
    console.error("❌ Fout bij publicRequests/multi:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij opslaan van de aanvraag.",
    });
  }
});

module.exports = router;
