// backend/routes/email.js
const express = require("express");
const router = express.Router();
const { sendMail } = require("../utils/mailer");

// ✅ Testroute: controleer of e-mailverzending werkt
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

module.exports = router;
