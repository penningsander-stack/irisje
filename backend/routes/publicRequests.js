// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer"); // ✅ Mailfunctie

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

    // ✅ IDs controleren
    const objectIds = companies
      .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (!objectIds.length) {
      return res.status(400).json({ ok: false, error: "Ongeldige bedrijfskeuze." });
    }

    const foundCompanies = await Company.find({ _id: { $in: objectIds } })
      .select("_id name email owner")
      .lean();

    if (!foundCompanies.length) {
      return res.status(404).json({ ok: false, error: "Geen van de gekozen bedrijven bestaat." });
    }

    // ✅ Opslaan in database
    const toInsert = foundCompanies.map((c) => ({
      name: customerName,
      email: customerEmail,
      message,
      company: c._id,
      status: "Nieuw",
      date: new Date(),
    }));

    const inserted = await Request.insertMany(toInsert);

    // 📩 Log in console
    console.log(
      `📩 Nieuwe openbare aanvraag van ${customerName} <${customerEmail}> voor bedrijven: ${foundCompanies
        .map((c) => c.name)
        .join(", ")}`
    );

    // ✅ 1️⃣ Mail naar Irisje.nl (beheer)
    await sendMail({
      to: process.env.SMTP_FROM,
      subject: "Nieuwe aanvraag via Irisje.nl",
      html: `
        <h2 style="color:#4F46E5;">Nieuwe aanvraag via Irisje.nl</h2>
        <p><b>Naam:</b> ${customerName}</p>
        <p><b>Email:</b> ${customerEmail}</p>
        <p><b>Bericht:</b> ${message}</p>
        <p><b>Bedrijven:</b> ${foundCompanies.map((c) => c.name).join(", ")}</p>
        <p style="font-size:12px;color:#666;">Ontvangen op ${new Date().toLocaleString("nl-NL")}</p>
      `,
    });

    // ✅ 2️⃣ Professionele bevestiging naar klant
    const firstCompany = foundCompanies[0];
    await sendMail({
      to: customerEmail,
      subject: `Je aanvraag bij ${firstCompany.name} is ontvangen`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
          <div style="background:#4F46E5;color:white;padding:16px;text-align:center;">
            <img src="https://irisje.nl/favicon.ico" alt="Irisje.nl" style="width:48px;height:48px;border-radius:8px;margin-bottom:8px;">
            <h2 style="margin:0;font-size:20px;">Irisje.nl</h2>
          </div>
          <div style="padding:24px;">
            <p>Beste ${customerName},</p>
            <p>Bedankt voor je aanvraag via <b>Irisje.nl</b>.</p>
            <p>We hebben je bericht doorgestuurd naar <b>${firstCompany.name}</b>. Zij nemen zo snel mogelijk contact met je op.</p>
            <p style="margin-top:16px;color:#555;">Bericht dat je verstuurde:</p>
            <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;color:#555;">${message}</blockquote>
            <p style="margin-top:16px;">Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
          </div>
          <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#777;">
            © ${new Date().getFullYear()} Irisje.nl – Alle rechten voorbehouden
          </div>
        </div>
      `,
    });

    console.log(`📧 Bevestigingsmail verzonden naar ${customerEmail}`);

    res.json({ ok: true, created: inserted.length });
  } catch (err) {
    console.error("❌ Fout bij publicRequests/multi:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij opslaan van de aanvraag." });
  }
});

module.exports = router;
