// backend/routes/publicRequests.js
/**
 * irisje.nl – publicRequests routes
 * ------------------------------------------------
 * Publieke aanvraagroutes (geen login nodig):
 * - POST /               → enkelvoudige aanvraag naar 1 bedrijf
 * - POST /multi          → multi-aanvraag naar max 5 bedrijven
 *
 * Inclusief:
 * - in-memory rate limiting per IP
 * - opslaan in Request-model
 * - e-mail naar admin, klant en bedrijven (Brevo/SMTP via utils/mailer)
 */

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

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, start: now };
  const elapsed = now - entry.start;

  if (elapsed > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, start: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return true;
}

/* ============================================================
   Helpers
============================================================ */
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanText(v) {
  return String(v || "").trim().replace(/[<>]/g, "");
}

function cleanOptional(v) {
  return String(v || "").trim();
}

function formatDateNl(date) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

/* ============================================================
   📩 Enkelvoudige aanvraag + e-mails
   Endpoint sluit aan op frontend/js/request.js
   POST /api/publicRequests
============================================================ */
router.post("/", async (req, res) => {
  try {
    const ip = getClientIp(req);

    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        ok: false,
        success: false,
        error:
          "Je hebt even te vaak een aanvraag verstuurd. Probeer het over een uur opnieuw.",
      });
    }

    const {
      name,
      email,
      city,
      message,
      company, // companyId vanuit frontend
      category,
      specialty,
      communication,
      experience,
      approach,
      involvement,
    } = req.body || {};

    // Basisvalidatie
    if (!cleanText(name) || !cleanText(email) || !cleanText(message)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Naam, e-mailadres en bericht zijn verplicht.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Ongeldig e-mailadres.",
      });
    }

    if (!company || !mongoose.isValidObjectId(company)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Ongeldig of ontbrekend bedrijf.",
      });
    }

    // Bedrijf ophalen
    const foundCompany = await Company.findById(company)
      .select("_id name email owner slug city")
      .lean();

    if (!foundCompany) {
      return res.status(404).json({
        ok: false,
        success: false,
        error: "Bedrijf bestaat niet (meer).",
      });
    }

    const now = new Date();
    const dateStr = formatDateNl(now);

    // Opslaan aanvraag
    const requestDoc = await Request.create({
      name: cleanText(name),
      email: cleanText(email),
      city: cleanOptional(city),
      message: cleanText(message),
      company: foundCompany._id,
      status: "Nieuw",
      date: now,

      // extra velden (nieuwe aanvraagvelden)
      category: cleanOptional(category),
      specialty: cleanOptional(specialty),
      communication: cleanOptional(communication),
      experience: cleanOptional(experience),
      approach: cleanOptional(approach),
      involvement: cleanOptional(involvement),
    });

    console.log(
      `📩 Nieuwe aanvraag van ${name} <${email}> voor bedrijf: ${foundCompany.name}`
    );

    /* ============================================================
       ✉️ E-mails verzenden
    ============================================================ */
    const adminTo = process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER;

    const adminMail = adminTo
      ? sendMail({
          to: adminTo,
          subject: "Nieuwe aanvraag via Irisje.nl",
          html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
              <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
              <p style="color:#374151;">Er is zojuist een nieuwe aanvraag binnengekomen.</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
                <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${cleanText(name)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mail:</b></td><td>${cleanText(email)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🏙️ <b>Plaats:</b></td><td>${cleanOptional(city) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${cleanText(message)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🏢 <b>Bedrijf:</b></td><td>${foundCompany.name}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">📂 <b>Categorie:</b></td><td>${cleanOptional(category) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🧰 <b>Specialisme:</b></td><td>${cleanOptional(specialty) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">☎️ <b>Communicatie:</b></td><td>${cleanOptional(communication) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">⭐ <b>Ervaring:</b></td><td>${cleanOptional(experience) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🛠️ <b>Aanpak:</b></td><td>${cleanOptional(approach) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🤝 <b>Betrokkenheid:</b></td><td>${cleanOptional(involvement) || "-"}</td></tr>
              </table>
              <p style="font-size:13px;color:#6b7280;">Ontvangen op ${dateStr}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
              <p style="font-size:13px;color:#9ca3af;">📮 Automatische melding Irisje.nl.</p>
            </div>
          `,
        })
      : Promise.resolve("skip");

    const clientMail = sendMail({
      to: cleanText(email),
      subject: "Bevestiging van je aanvraag via Irisje.nl",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
          <img src="https://irisje.nl/favicon.ico" alt="Irisje.nl" style="width:40px;height:40px;border-radius:8px;display:block;margin:auto;margin-bottom:16px;">
          <h2 style="text-align:center;color:#4F46E5;margin:0;">Bevestiging van je aanvraag</h2>
          <p style="color:#374151;margin-top:24px;">Beste ${cleanText(name)},</p>
          <p style="color:#374151;">Bedankt voor je aanvraag via <b>Irisje.nl</b>.</p>
          <p style="color:#374151;">We hebben je bericht doorgestuurd naar:</p>
          <ul style="color:#111827;margin-top:8px;margin-bottom:16px;">
            <li>${foundCompany.name}</li>
          </ul>
          <p style="color:#374151;">Dit bedrijf neemt zo snel mogelijk contact met je op.</p>
          <p style="margin-top:16px;color:#555;">Bericht dat je verstuurde:</p>
          <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;margin:8px 0;color:#555;">
            ${cleanText(message)}
          </blockquote>
          <p style="margin-top:24px;color:#374151;">Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="text-align:center;font-size:12px;color:#9ca3af;">© ${now.getFullYear()} Irisje.nl – Alle rechten voorbehouden</p>
        </div>
      `,
    });

    const companyMail = foundCompany.email
      ? sendMail({
          to: foundCompany.email,
          subject: `Nieuwe aanvraag via Irisje.nl – ${cleanText(name)}`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
              <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
              <p style="color:#374151;">Beste ${foundCompany.name},</p>
              <p style="color:#374151;">Je hebt een nieuwe aanvraag ontvangen:</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
                <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${cleanText(name)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mail:</b></td><td>${cleanText(email)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🏙️ <b>Plaats:</b></td><td>${cleanOptional(city) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${cleanText(message)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">📂 <b>Categorie:</b></td><td>${cleanOptional(category) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🧰 <b>Specialisme:</b></td><td>${cleanOptional(specialty) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">☎️ <b>Communicatie:</b></td><td>${cleanOptional(communication) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">⭐ <b>Ervaring:</b></td><td>${cleanOptional(experience) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🛠️ <b>Aanpak:</b></td><td>${cleanOptional(approach) || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">🤝 <b>Betrokkenheid:</b></td><td>${cleanOptional(involvement) || "-"}</td></tr>
              </table>
              <p style="color:#374151;">Log in op je <b>bedrijfsdashboard</b> via
                <a href="https://irisje.nl/dashboard.html" style="color:#4F46E5;text-decoration:none;">irisje.nl</a>
                om te reageren of status te beheren.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
              <p style="font-size:13px;color:#9ca3af;">📮 Automatische melding Irisje.nl.</p>
            </div>
          `,
        })
      : Promise.resolve("skip");

    const results = await Promise.allSettled([
      adminMail,
      clientMail,
      companyMail,
    ]);

    results.forEach((r, i) => {
      const label = i === 0 ? "beheer" : i === 1 ? "klant" : "bedrijf";
      if (r.status === "fulfilled") console.log(`📧 Mail verzonden (${label})`);
      else
        console.error(
          `⚠️ Fout bij verzenden (${label}):`,
          r.reason?.message
        );
    });

    return res.json({
      ok: true,
      success: true,
      created: 1,
      requestId: requestDoc._id,
    });
  } catch (err) {
    console.error("❌ Fout bij POST /api/publicRequests:", err);
    return res.status(500).json({
      ok: false,
      success: false,
      error: "Serverfout bij opslaan of verzenden van de aanvraag.",
    });
  }
});

/* ============================================================
   📩 Multi-aanvraag (max. 5 bedrijven) + e-mail naar bedrijven
   POST /api/publicRequests/multi
============================================================ */
router.post("/multi", async (req, res) => {
  try {
    const ip = getClientIp(req);

    // 🔒 Rate limit controle
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        ok: false,
        success: false,
        error:
          "Je hebt even te vaak een aanvraag verstuurd. Probeer het over een uur opnieuw.",
      });
    }

    const { customerName, customerEmail, message, companies } = req.body || {};

    // 🔍 Basisvalidatie
    if (
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Naam, e-mailadres en bericht zijn verplicht.",
      });
    }
    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Ongeldig e-mailadres.",
      });
    }
    if (!Array.isArray(companies) || companies.length === 0) {
      return res
        .status(400)
        .json({ ok: false, success: false, error: "Kies minstens één bedrijf." });
    }
    if (companies.length > 5) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Je kunt maximaal 5 bedrijven selecteren.",
      });
    }

    // 🧩 IDs controleren
    const objectIds = companies
      .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res
        .status(400)
        .json({ ok: false, success: false, error: "Ongeldige bedrijfskeuze." });
    }

    // 🏢 Bedrijven ophalen
    const foundCompanies = await Company.find({ _id: { $in: objectIds } })
      .select("_id name email owner")
      .lean();

    if (!foundCompanies.length) {
      return res.status(404).json({
        ok: false,
        success: false,
        error: "Geen van de gekozen bedrijven bestaat.",
      });
    }

    const cleanMsg = cleanText(message);
    const now = new Date();
    const dateStr = formatDateNl(now);

    // 💾 Opslaan in database
    const toInsert = foundCompanies.map((c) => ({
      name: cleanText(customerName),
      email: cleanText(customerEmail),
      message: cleanMsg,
      company: c._id,
      status: "Nieuw",
      date: now,
    }));

    const inserted = await Request.insertMany(toInsert);
    const companyNames = foundCompanies.map((c) => c.name).join(", ");

    console.log(
      `📩 Nieuwe multi-aanvraag van ${customerName} <${customerEmail}> voor bedrijven: ${companyNames}`
    );

    /* ============================================================
       ✉️ E-mails verzenden
    ============================================================ */
    const adminTo = process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER;

    const adminMail = adminTo
      ? sendMail({
          to: adminTo,
          subject: "Nieuwe aanvraag via Irisje.nl (multi)",
          html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
              <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe multi-aanvraag via Irisje.nl</h2>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
                <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${cleanText(customerName)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mailadres:</b></td><td>${cleanText(customerEmail)}</td></tr>
                <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${cleanMsg}</td></tr>
                <tr><td style="padding:4px 0;color:#555;vertical-align:top;">🏢 <b>Bedrijven:</b></td><td>${companyNames}</td></tr>
              </table>
              <p style="font-size:13px;color:#6b7280;">Ontvangen op ${dateStr}</p>
            </div>
          `,
        })
      : Promise.resolve("skip");

    const clientMail = sendMail({
      to: cleanText(customerEmail),
      subject: "Bevestiging van je aanvraag via Irisje.nl",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
          <h2 style="text-align:center;color:#4F46E5;margin:0;">Bevestiging van je aanvraag</h2>
          <p style="color:#374151;margin-top:24px;">Beste ${cleanText(
            customerName
          )},</p>
          <p style="color:#374151;">Bedankt voor je aanvraag via <b>Irisje.nl</b>.</p>
          <p style="color:#374151;">We hebben je bericht doorgestuurd naar:</p>
          <ul style="color:#111827;margin-top:8px;margin-bottom:16px;">
            ${foundCompanies.map((c) => `<li>${c.name}</li>`).join("")}
          </ul>
          <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;margin:8px 0;color:#555;">
            ${cleanMsg}
          </blockquote>
          <p style="margin-top:24px;color:#374151;">Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
        </div>
      `,
    });

    const companyMails = foundCompanies.map((c) =>
      c.email
        ? sendMail({
            to: c.email,
            subject: `Nieuwe aanvraag via Irisje.nl – ${cleanText(
              customerName
            )}`,
            html: `
              <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
                <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
                <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
                  <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${cleanText(customerName)}</td></tr>
                  <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mailadres:</b></td><td>${cleanText(customerEmail)}</td></tr>
                  <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${cleanMsg}</td></tr>
                </table>
                <p style="color:#374151;">Log in op je dashboard op
                  <a href="https://irisje.nl/dashboard.html" style="color:#4F46E5;text-decoration:none;">irisje.nl</a>
                  om te reageren of status te beheren.</p>
              </div>
            `,
          })
        : Promise.resolve("skip")
    );

    const results = await Promise.allSettled([
      adminMail,
      clientMail,
      ...companyMails,
    ]);

    results.forEach((r, i) => {
      const label =
        i === 0
          ? "beheer"
          : i === 1
          ? "klant"
          : `bedrijf ${foundCompanies[i - 2]?.name || "?"}`;
      if (r.status === "fulfilled") console.log(`📧 Mail verzonden (${label})`);
      else
        console.error(
          `⚠️ Fout bij verzenden (${label}):`,
          r.reason?.message
        );
    });

    return res.json({
      ok: true,
      success: true,
      created: inserted.length,
    });
  } catch (err) {
    console.error("❌ Fout bij POST /api/publicRequests/multi:", err);
    return res.status(500).json({
      ok: false,
      success: false,
      error: "Serverfout bij opslaan of verzenden van de aanvraag.",
    });
  }
});

module.exports = router;
