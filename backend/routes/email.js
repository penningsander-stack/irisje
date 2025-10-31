// backend/routes/email.js
const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// SMTP-config via .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Testmail om te controleren of SMTP werkt
router.get("/test", async (_req, res) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_FROM,
      subject: "✅ SMTP-test vanaf Irisje.nl",
      text: "Dit is een testmail vanaf de Irisje backend. SMTP werkt correct!",
    });
    res.json({ ok: true, message: `✅ Testmail verzonden naar ${process.env.MAIL_FROM}` });
  } catch (err) {
    console.error("SMTP-testfout:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Placeholder voor toekomstige mailfunctionaliteit
router.post("/send", (_req, res) => {
  res.json({ ok: true, message: "Mail queued (placeholder)" });
});

module.exports = router;
