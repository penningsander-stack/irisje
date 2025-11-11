// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer");

/* ============================================================
   🔒 Eenvoudige in-memory rate limiter per IP
   (max 3 aanvragen per 60 minuten)
============================================================ */
const rateLimitStore = new Map();
const MAX_REQUESTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 uur

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, start: now };
  const elapsed = now - entry.start;

  if (elapsed > WINDOW_MS) {
    // reset window
    rateLimitStore.set(ip, { count: 1, start: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return true;
}

/* ============================================================
   📩 Multi-aanvraag (max. 5 bedrijven) + e-mail naar bedrijven
============================================================ */
router.post("/multi", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

    // 🔒 Rate limit controle
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        ok: false,
        error:
          "Je hebt even te vaak een aanvraag verstuurd. Probeer het over een uur opnieuw."
      });
    }

    const { customerName, customerEmail, message, companies } = req.body || {};

    // 🔍 Basisvalidatie
    if (!customerName?.trim() || !customerEmail?.trim() || !message?.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Naam, e-mailadres en bericht zijn verplicht." });
    }
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ ok: false, error: "Kies minstens één bedrijf." });
    }
    if (companies.length > 5) {
      return res
        .status(400)
        .json({ ok: false, error: "Je kunt maximaal 5 bedrijven selecteren." });
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
      return res
        .status(404)
        .json({ ok: false, error: "Geen van de gekozen bedrijven bestaat." });
    }

    // 🧹 Bericht opschonen
    const cleanText = message.trim().replace(/[<>]/g, "");
    const now = new Date();

    // 💾 Opslaan in database
    const toInsert = foundCompanies.map((c) => ({
      name: customerName.trim(),
      email: customerEmail.trim(),
      message: cleanText,
      company: c._id,
      status: "Nieuw",
      date: now
    }));

    const inserted = await Request.insertMany(toInsert);
    const companyNames = foundCompanies.map((c) => c.name).join(", ");
    console.log(
      `📩 Nieuwe aanvraag van ${customerName} <${customerEmail}> voor bedrijven: ${companyNames}`
    );

    const dateStr = new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "full",
      timeStyle: "short"
    }).format(now);

    /* ============================================================
       ✉️ E-mails verzenden
    ============================================================ */

    // 1️⃣ Beheermelding naar Irisje.nl
    const adminMail = sendMail({
      to: process.env.SMTP_FROM,
      subject: "Nieuwe aanvraag via Irisje.nl",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
          <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
          <p style="color:#374151;">Er is zojuist een nieuwe aanvraag binnengekomen via <b>Irisje.nl</b>.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
            <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${customerName}</td></tr>
            <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mailadres:</b></td><td>${customerEmail}</td></tr>
            <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${cleanText}</td></tr>
            <tr><td style="padding:4px 0;color:#555;vertical-align:top;">🏢 <b>Bedrijven:</b></td><td>${companyNames}</td></tr>
          </table>
          <p style="font-size:13px;color:#6b7280;">Ontvangen op ${dateStr}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:13px;color:#9ca3af;">📮 Deze melding is automatisch gegenereerd door Irisje.nl.<br>Reageren is niet nodig.</p>
        </div>
      `
    });

    // 2️⃣ Bevestiging naar klant
    const clientMail = sendMail({
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
            ${cleanText}
          </blockquote>
          <p style="margin-top:24px;color:#374151;">Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="text-align:center;font-size:12px;color:#9ca3af;">© ${now.getFullYear()} Irisje.nl – Alle rechten voorbehouden</p>
        </div>
      `
    });

    // 3️⃣ Mails naar geselecteerde bedrijven
    const companyMails = foundCompanies.map((c) =>
      c.email
        ? sendMail({
            to: c.email,
            subject: `Nieuwe aanvraag via Irisje.nl – ${customerName}`,
            html: `
              <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
                <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
                <p style="color:#374151;">Beste ${c.name},</p>
                <p style="color:#374151;">Je hebt een nieuwe aanvraag ontvangen via <b>Irisje.nl</b>:</p>
                <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
                  <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${customerName}</td></tr>
                  <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mailadres:</b></td><td>${customerEmail}</td></tr>
                  <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${cleanText}</td></tr>
                </table>
                <p style="color:#374151;">Log in op je <b>bedrijfsdashboard</b> op <a href="https://irisje.nl/dashboard.html" style="color:#4F46E5;text-decoration:none;">irisje.nl</a> om te reageren of de status te beheren.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                <p style="font-size:13px;color:#9ca3af;">📮 Deze melding is automatisch gegenereerd door Irisje.nl.</p>
              </div>
            `
          })
        : Promise.resolve("skip")
    );

    // Alles tegelijk uitvoeren en afvangen
    const results = await Promise.allSettled([adminMail, clientMail, ...companyMails]);
    results.forEach((r, i) => {
      const label =
        i === 0
          ? "beheer"
          : i === 1
          ? "klant"
          : `bedrijf ${foundCompanies[i - 2]?.name || "?"}`;
      if (r.status === "fulfilled") console.log(`📧 Mail verzonden (${label})`);
      else console.error(`⚠️ Fout bij verzenden (${label}):`, r.reason?.message);
    });

    // ✅ Response
    res.json({ ok: true, created: inserted.length });
  } catch (err) {
    console.error("❌ Fout bij POST /api/publicRequests/multi:", err);
    res
      .status(500)
      .json({ ok: false, error: "Serverfout bij opslaan of verzenden van de aanvraag." });
  }
});

module.exports = router;
