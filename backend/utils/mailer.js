// backend/utils/mailer.js
// Uitbreiding: helper-functies voor meldingen bij nieuwe aanvraag en gemelde review.
// *Backwards compatible*: bestaande sendMail blijft werken.
// Vereist: geldige SMTP-config in .env (bijv. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)

const nodemailer = require("nodemailer");

const {
  SMTP_HOST = "smtp.example.com",
  SMTP_PORT = 587,
  SMTP_SECURE = "false",
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = "Irisje.nl <no-reply@irisje.nl>",
  NOTIFY_ADMIN_EMAIL, // optioneel, voor admin-notificaties
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: String(SMTP_SECURE).toLowerCase() === "true",
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

// Basishulp
async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html: html || (text ? `<pre>${escapeHtml(text)}</pre>` : undefined),
  });
  return info;
}

// Nieuwe: notificatie bij nieuwe aanvraag (naar bedrijf)
async function sendNewRequestNotification(to, requestData) {
  const {
    name = "Onbekende afzender",
    email = "—",
    message = "—",
    createdAt = new Date(),
  } = requestData || {};

  const subject = "Nieuwe aanvraag via Irisje.nl";
  const html = `
    <h2>Nieuwe aanvraag ontvangen</h2>
    <p>Je hebt zojuist een nieuwe aanvraag ontvangen via Irisje.nl.</p>
    <table border="0" cellpadding="6" cellspacing="0">
      <tr><td><strong>Naam</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>E-mail</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Bericht</strong></td><td>${escapeHtml(message)}</td></tr>
      <tr><td><strong>Ontvangen</strong></td><td>${new Date(createdAt).toLocaleString("nl-NL")}</td></tr>
    </table>
    <p>Bekijk en beheer de aanvraag in je dashboard.</p>
  `;

  return sendMail({ to, subject, html });
}

// Nieuwe: notificatie aan admin bij gemelde review
async function sendReviewReportedNotification(review, extra = {}) {
  const adminTo = extra.adminEmail || NOTIFY_ADMIN_EMAIL;
  if (!adminTo) return { skipped: true, reason: "Geen adminmail ingesteld" };

  const {
    _id = "—",
    authorName = "Onbekend",
    rating = "—",
    message = "—",
    companyName = "—",
    createdAt = new Date(),
  } = review || {};

  const subject = "Review gemeld — actie vereist";
  const html = `
    <h2>Er is een review gemeld</h2>
    <table border="0" cellpadding="6" cellspacing="0">
      <tr><td><strong>Review ID</strong></td><td>${escapeHtml(String(_id))}</td></tr>
      <tr><td><strong>Bedrijf</strong></td><td>${escapeHtml(companyName)}</td></tr>
      <tr><td><strong>Naam klant</strong></td><td>${escapeHtml(authorName)}</td></tr>
      <tr><td><strong>Beoordeling</strong></td><td>${escapeHtml(String(rating))}</td></tr>
      <tr><td><strong>Bericht</strong></td><td>${escapeHtml(message)}</td></tr>
      <tr><td><strong>Datum</strong></td><td>${new Date(createdAt).toLocaleString("nl-NL")}</td></tr>
    </table>
    <p>Bekijk de gemelde review in de <a href="https://irisje-frontend.onrender.com/admin.html">adminomgeving</a>.</p>
  `;

  return sendMail({ to: adminTo, subject, html });
}

// Kleine helper
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  transporter,
  sendMail,
  sendNewRequestNotification,
  sendReviewReportedNotification,
};
