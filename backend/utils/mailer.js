// backend/utils/mailer.js
const nodemailer = require("nodemailer");

let transporter;

async function initMailer() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("📨 [Irisje] SMTP-mailer actief en gecontroleerd.");
  } catch (err) {
    console.error("⚠️ [Irisje] SMTP-verbinding mislukt:", err.message);
  }

  return transporter;
}

async function sendMail({ to, subject, html }) {
  const mailer = await initMailer();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
  };

  return mailer.sendMail(mailOptions);
}

module.exports = { sendMail };
