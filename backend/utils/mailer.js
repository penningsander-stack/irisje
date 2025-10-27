// backend/utils/mailer.js
const nodemailer = require("nodemailer");

async function sendMail({ to, subject, text, html }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.webreus.nl",          // ✅ Webreus SMTP-server
      port: 465,                        // meestal 465 voor SSL
      secure: true,                     // gebruik SSL
      auth: {
        user: "info@irisje.nl",         // jouw e-mailadres
        pass: process.env.SMTP_PASS,    // wachtwoord in .env opslaan
      },
    });

    await transporter.sendMail({
      from: '"Irisje.nl" <info@irisje.nl>',
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Mail succesvol verstuurd naar ${to}`);
  } catch (err) {
    console.error("❌ Fout bij mailverzending:", err);
  }
}

module.exports = { sendMail };
