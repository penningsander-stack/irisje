// backend/utils/mailer.js
const nodemailer = require("nodemailer");

async function sendMail({ to, subject, text, html }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "jouwadres@gmail.com",      // vervang dit door je echte Gmail-adres
        pass: process.env.SMTP_PASS,      // app-wachtwoord uit je .env
      },
    });

    await transporter.sendMail({
      from: '"Irisje.nl" <info@irisje.nl>', // naam + afzenderadres
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
