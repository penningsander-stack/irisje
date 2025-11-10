// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer");

// ✅ Testroute
router.get("/", (req, res) => {
  res.json({ ok: true, message: "publicRequests router actief" });
});

/* ============================================================
   📩 Multi-aanvraag (max. 5 bedrijven)
============================================================ */
router.post("/multi", async (req, res) => {
  try {
    const { customerName, customerEmail, message, companies } = req.body || {};

    // 🔍 Basisvalidatie
    if (!customerName?.trim() || !customerEmail?.trim() || !message?.trim()) {
      return res.status(400).json({ ok: false, error: "Naam, e-mailadres en bericht zijn verplicht." });
    }
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ ok: false, error: "Kies minstens één bedrijf." });
    }
    if (companies.length > 5) {
      return res.status(400).json({ ok: false, error: "Je kunt maximaal 5 bedrijven selecteren." });
    }

    // 🧩 IDs controleren
    const objectIds = companies
      .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.status(400).json({ ok: false, error: "Ongeldige bedrijfskeuze." });
    }

    // 🏢 Bedrijven ophalen
    const foundCompanies = await Company.find({ _id: { $in: objectIds } })
      .select("_id name email owner")
      .lean();

    if (!foundCompanies.length) {
      return res.status(404).json({ ok: false, error: "Geen van de gekozen bedrijven bestaat." });
    }

    // 💾 Opslaan in database
    const toInsert = foundCompanies.map((c) => ({
      name: customerName.trim(),
      email: customerEmail.trim(),
      message: message.trim(),
      company: c._id,
      status: "Nieuw",
      date: new Date(),
    }));

    const inserted = await Request.insertMany(toInsert);

    const companyNames = foundCompanies.map((c) => c.name).join(", ");
    console.log(`📩 Nieuwe aanvraag van ${customerName} <${customerEmail}> voor bedrijven: ${companyNames}`);

    /* ============================================================
       ✉️ E-mails verzenden
    ============================================================ */

    // 1️⃣ Beheermelding naar Irisje.nl
    try {
      await sendMail({
        to: process.env.SMTP_FROM,
        subject: "Nieuwe aanvraag via Irisje.nl",
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
            <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
            <p style="color:#374151;">Er is zojuist een nieuwe aanvraag binnengekomen via <b>Irisje.nl</b>.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
              <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${customerName}</td></tr>
              <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mailadres:</b></td><td>${customerEmail}</td></tr>
              <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${message}</td></tr>
              <tr><td style="padding:4px 0;color:#555;vertical-align:top;">🏢 <b>Bedrijven:</b></td><td>${companyNames}</td></tr>
            </table>
            <p style="font-size:13px;color:#6b7280;">Ontvangen op ${new Date().toLocaleString("nl-NL")}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
            <p style="font-size:13px;color:#9ca3af;">📮 Deze melding is automatisch gegenereerd door Irisje.nl.<br>Reageren is niet nodig.</p>
          </div>
        `,
      });
      console.log("📧 Beheermail verzonden naar info@irisje.nl");
    } catch (err) {
      console.error("⚠️ Fout bij verzenden beheermail:", err.message);
    }

    // 2️⃣ Bevestiging naar klant
    try {
      await sendMail({
        to: customerEmail,
        subject: "Bevestiging van je aanvraag via Irisje.nl",
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
            <img src="https://irisje.nl/favicon.ico" alt="Irisje.nl" style="width:40px;height:40px;border-radius:8px;display:block;margin:auto;margin-bottom:16px;">
            <h2 style="text-align:center;color:#4F46E5;margin:0;">Bevestiging van je aanvraag</h2>
            <p style="color:#374151;margin-top:24px;">Beste ${customerName},</p>
            <p style="color:#374151;">Bedankt voor je aanvraag via <b>Irisje.nl</b>.</p>
            <p style="color:#374151;">We hebben je bericht doorgestuurd naar de volgende bedrijven:</p>
            <ul style="color:#111827;margin-top:8px;margin-bottom:16px;">
              ${foundCompanies.map((c) => `<li>${c.name}</li>`).join("")}
            </ul>
            <p style="color:#374151;">Zij nemen zo snel mogelijk contact met je op.</p>
            <p style="margin-top:16px;color:#555;">Bericht dat je verstuurde:</p>
            <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;margin:8px 0;color:#555;">
              ${message}
            </blockquote>
            <p style="margin-top:24px;color:#374151;">Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="text-align:center;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Irisje.nl – Alle rechten voorbehouden</p>
          </div>
        `,
      });
      console.log(`📧 Klantmail verzonden naar ${customerEmail}`);

      // 3️⃣ Log korte versie (voor toekomst WhatsApp/SMS)
      console.log(
        `💬 Berichttekst: "Hoi ${customerName}, je aanvraag via Irisje.nl is doorgestuurd naar ${companyNames}. Zij nemen binnenkort contact met je op."`
      );
    } catch (err) {
      console.error(`⚠️ Fout bij verzenden klantmail (${customerEmail}):`, err.message);
    }

    // ✅ Succes
    res.json({ ok: true, created: inserted.length });
  } catch (err) {
    console.error("❌ Fout bij publicRequests/multi:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij opslaan van de aanvraag." });
  }
});

module.exports = router;
