// backend/routes/email.js
// ✅ Stabiele router voor e-mailverzending via Nodemailer of PHPMailer

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/email/send
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ message: 'Ontvanger, onderwerp en bericht zijn verplicht.' });
    }

    // Transporter configuratie — pas aan indien nodig
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'info@irisje.nl',
        pass: process.env.SMTP_PASS || '***ZET_HIER_JE_WW***'
      }
    });

    // E-mail versturen
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER || 'info@irisje.nl',
      to,
      subject,
      text,
      html
    });

    console.log('📧 E-mail verzonden:', info.messageId);
    res.json({ success: true, message: 'E-mail succesvol verzonden.' });
  } catch (err) {
    console.error('❌ E-mailfout:', err);
    res.status(500).json({ message: 'Serverfout bij e-mailverzending.' });
  }
});

module.exports = router;
