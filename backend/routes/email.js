// backend/routes/email.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { verifyToken } = require('../middleware/auth');

// 📧 Test endpoint om e-mailverzending te controleren
router.post('/test', verifyToken, async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Irisje.nl" <${process.env.SMTP_USER}>`,
      to: req.user?.email || 'info@irisje.nl',
      subject: 'Testmail Irisje',
      text: '✅ Dit is een testbericht vanuit de Irisje backend!',
      html: '<p>✅ Dit is een <strong>testbericht</strong> vanuit de Irisje backend!</p>'
    });

    console.log('📧 E-mail verzonden:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('❌ Fout bij e-mailverzending:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
