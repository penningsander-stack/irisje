// backend/routes/email.js
const express = require("express");
const router = express.Router();
const { sendMail } = require("../utils/mailer");

/* ============================================================
   ✅ Testmail naar beheer (bestaand)
============================================================ */
router.get("/test", async (req, res) => {
  try {
    await sendMail({
      to: process.env.SMTP_FROM, // verstuurt testmail naar info@irisje.nl
      subject: "✅ Testmail Irisje.nl – SMTP succesvol ingesteld",
      html: `
        <h2>Testmail van Irisje.nl</h2>
        <p>De verbinding met Brevo werkt correct ✅</p>
        <p>Tijdstip: ${new Date().toLocaleString("nl-NL")}</p>
      `,
    });

    console.log("📧 Testmail succesvol verzonden naar", process.env.SMTP_FROM);
    res.json({ ok: true, message: "Testmail verzonden. Controleer je inbox." });
  } catch (err) {
    console.error("❌ Fout bij verzenden testmail:", err);
    res.status(500).json({
      ok: false,
      error: "Fout bij verzenden testmail: " + err.message,
    });
  }
});

/* ============================================================
   🧪 NIEUW: Testmail naar klant (voorbeeld Irisje-stijl)
   Gebruik: GET /api/email/test-customer?to=naam@voorbeeld.nl
============================================================ */
router.get("/test-customer", async (req, res) => {
  const to = req.query.to;
  if (!to) {
    return res.status(400).json({
      ok: false,
      error: "Gebruik ?to=jouw@email.nl om een testmail te sturen.",
    });
  }

  try {
    await sendMail({
      to,
      subject: "Je aanvraag bij Croon Davidovich Advocaten is ontvangen",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
          <div style="background:#4F46E5;color:white;padding:16px;text-align:center;">
            <img src="https://irisje.nl/favicon.ico" alt="Irisje.nl" style="width:48px;height:48px;border-radius:8px;margin-bottom:8px;">
            <h2 style="margin:0;font-size:20px;">Irisje.nl</h2>
          </div>
          <div style="padding:24px;">
            <p>Beste <b>Sander Penning</b>,</p>
            <p>Bedankt voor je aanvraag via <b>Irisje.nl</b>.</p>
            <p>We hebben je bericht doorgestuurd naar <b>Croon Davidovich Advocaten</b>. Zij nemen zo snel mogelijk contact met je op.</p>
            <p style="margin-top:16px;color:#555;">Bericht dat je verstuurde:</p>
            <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;color:#555;">
              Dit is een testaanvraag om de klantmail te controleren.
            </blockquote>
            <p style="margin-top:16px;">Met vriendelijke groet,<br>Het team van <b>Irisje.nl</b></p>
          </div>
          <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#777;">
            © ${new Date().getFullYear()} Irisje.nl – Alle rechten voorbehouden
          </div>
        </div>
      `,
    });

    console.log(`📧 Test-klantmail verzonden naar ${to}`);
    res.json({ ok: true, message: `Testmail verzonden naar ${to}. Controleer je inbox.` });
  } catch (err) {
    console.error("❌ Fout bij verzenden test-klantmail:", err);
    res.status(500).json({
      ok: false,
      error: "Fout bij verzenden test-klantmail: " + err.message,
    });
  }
});

module.exports = router;
