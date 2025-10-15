// backend/utils/mailer.js
const nodemailer = require('nodemailer');

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.warn('⚠️ SMTP env vars ontbreken (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). E-mail wordt overgeslagen.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true voor 465, anders STARTTLS
    auth: { user, pass }
  });

  return transporter;
}

/**
 * Stuur een e-mail (HTML + tekst).
 * fields: { to, subject, html, text, bcc }
 */
async function sendMail(fields) {
  const transporter = getTransport();
  if (!transporter) return { ok: false, skipped: true, reason: 'missing smtp config' };

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const mail = {
    from,
    to: fields.to,
    subject: fields.subject || '(geen onderwerp)',
    text: fields.text || '',
    html: fields.html || fields.text || '',
    bcc: fields.bcc
  };

  const info = await transporter.sendMail(mail);
  return { ok: true, messageId: info.messageId };
}

module.exports = { sendMail };
