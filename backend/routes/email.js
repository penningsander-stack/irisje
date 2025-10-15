// backend/routes/email.js
const express = require('express');
const router = express.Router();
const { sendMail } = require('../utils/mailer');
const auth = require('../middleware/auth');

// Test e-mail sturen (ingelogd voldoende)
// POST /api/email/test  body: { to?, subject?, text? }
router.post('/test', auth(), async (req, res) => {
  try {
    const { to, subject, text } = req.body || {};
    const recipient = to || process.env.SMTP_USER;

    const out = await sendMail({
      to: recipient,
      subject: subject || 'Testmail van irisje-backend',
      text: text || 'Dit is een testmail vanaf irisje-backend.',
    });

    if (out.skipped) {
      return res.status(200).json({ ok: false, skipped: true, reason: out.reason });
    }

    return res.json({ ok: true, messageId: out.messageId });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
