// backend/utils/emailTemplates.js
/**
 * 📧 Centrale e-mailtemplates voor Irisje.nl
 * Alle e-mails zijn opgemaakt in een consistente, professionele stijl.
 */

const baseWrapper = (content) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;background:#ffffff;
              border:1px solid #e5e7eb;border-radius:12px;padding:24px;line-height:1.6;">
    ${content}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="text-align:center;font-size:12px;color:#9ca3af;">
      © ${new Date().getFullYear()} Irisje.nl – Alle rechten voorbehouden
    </p>
  </div>
`;

/* ============================================================
   📩 Beheermelding – Nieuwe aanvraag
============================================================ */
exports.newRequestAdmin = (customerName, customerEmail, message, companyNames) => {
  return baseWrapper(`
    <h2 style="color:#4F46E5;margin-bottom:8px;">Nieuwe aanvraag via Irisje.nl</h2>
    <p style="color:#374151;">Er is een nieuwe aanvraag binnengekomen via <b>Irisje.nl</b>.</p>

    <table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:16px;font-size:15px;">
      <tr><td style="padding:4px 0;color:#555;">👤 <b>Naam:</b></td><td>${customerName}</td></tr>
      <tr><td style="padding:4px 0;color:#555;">📧 <b>E-mailadres:</b></td><td>${customerEmail}</td></tr>
      <tr><td style="padding:4px 0;color:#555;vertical-align:top;">💬 <b>Bericht:</b></td><td>${message}</td></tr>
      <tr><td style="padding:4px 0;color:#555;vertical-align:top;">🏢 <b>Bedrijven:</b></td><td>${companyNames}</td></tr>
    </table>

    <p style="font-size:13px;color:#6b7280;">Ontvangen op ${new Date().toLocaleString("nl-NL")}</p>

    <p style="font-size:13px;color:#9ca3af;margin-top:16px;">
      📮 Deze melding is automatisch gegenereerd door Irisje.nl.<br>
      Reageren op deze e-mail is niet nodig.
    </p>
  `);
};

/* ============================================================
   💌 Klantbevestiging – Aanvraag verzonden
============================================================ */
exports.newRequestCustomer = (customerName, message, foundCompanies) => {
  return baseWrapper(`
    <img src="https://irisje.nl/favicon.ico" alt="Irisje.nl logo"
         style="width:40px;height:40px;border-radius:8px;display:block;margin:auto;margin-bottom:16px;">
    <h2 style="text-align:center;color:#4F46E5;margin:0;">Bevestiging van je aanvraag</h2>

    <p style="color:#374151;margin-top:24px;">Beste ${customerName},</p>
    <p style="color:#374151;">Bedankt voor je aanvraag via <b>Irisje.nl</b>.</p>
    <p style="color:#374151;">We hebben je bericht doorgestuurd naar de volgende bedrijven:</p>

    <ul style="color:#111827;margin-top:8px;margin-bottom:16px;padding-left:18px;">
      ${foundCompanies.map((c) => `<li>${c.name}</li>`).join("")}
    </ul>

    <p style="color:#374151;">Zij nemen zo snel mogelijk contact met je op.</p>

    <p style="margin-top:16px;color:#555;">Je bericht:</p>
    <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;margin-top:6px;color:#555;">
      ${message}
    </blockquote>

    <p style="margin-top:24px;color:#374151;">
      Met vriendelijke groet,<br>
      Het team van <b>Irisje.nl</b>
    </p>
  `);
};

/* ============================================================
   📨 Reviewbevestiging – klant moet review bevestigen
============================================================ */
exports.reviewConfirmationCustomer = (name, companyName, message, confirmUrl) => {
  return baseWrapper(`
    <img src="https://irisje.nl/favicon.ico" alt="Irisje.nl logo"
         style="width:48px;height:48px;border-radius:10px;display:block;margin:auto;margin-bottom:16px;">
    <h2 style="text-align:center;color:#4F46E5;margin-bottom:12px;">Bevestig je review</h2>

    <p style="color:#374151;">Beste ${name},</p>
    <p style="color:#374151;">
      Bedankt dat je een review hebt geschreven voor <b>${companyName}</b> via <b>Irisje.nl</b>.
      Om misbruik te voorkomen vragen we je om de review te bevestigen voordat deze wordt geplaatst.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <a href="${confirmUrl}" target="_blank"
         style="background:#4F46E5;color:#ffffff;padding:12px 24px;border-radius:8px;
                text-decoration:none;font-weight:600;display:inline-block;">
        ✅ Bevestig mijn review
      </a>
    </div>

    <p style="color:#6b7280;font-size:13px;margin-bottom:16px;">
      Werkt de knop niet? Kopieer en plak deze link in je browser:<br>
      <span style="word-break:break-all;color:#4F46E5;">${confirmUrl}</span>
    </p>

    <p style="color:#374151;margin-top:12px;">Je review:</p>
    <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;margin-top:6px;color:#555;">
      ${message}
    </blockquote>

    <p style="margin-top:20px;color:#374151;">
      Met vriendelijke groet,<br>
      Het team van <b>Irisje.nl</b>
    </p>
  `);
};

/* ============================================================
   🏢 Reviewbevestiging – melding aan beheer
============================================================ */
exports.reviewConfirmedAdmin = (companyName, reviewerName, rating, message) => {
  return baseWrapper(`
    <h2 style="color:#4F46E5;margin-bottom:12px;">Nieuwe bevestigde review</h2>
    <p style="color:#374151;">
      Er is zojuist een review bevestigd voor <b>${companyName}</b>.
    </p>

    <p style="color:#374151;margin-top:12px;">
      <b>Naam:</b> ${reviewerName}<br>
      <b>Score:</b> ${"⭐".repeat(rating)} (${rating}/5)
    </p>

    <p style="margin-top:12px;color:#374151;">Reviewtekst:</p>
    <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;margin-top:6px;color:#555;">
      ${message}
    </blockquote>

    <p style="font-size:13px;color:#9ca3af;margin-top:16px;">
      Deze melding is automatisch gegenereerd door Irisje.nl.
    </p>
  `);
};
