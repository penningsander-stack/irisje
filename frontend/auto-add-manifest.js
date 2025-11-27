/* frontend/auto-add-manifest.js
   ➜ Voegt automatisch <link rel="manifest" href="manifest.json" /> toe aan elk HTML-bestand
*/

(async () => {
  console.log("🌸 Irisje.nl – automatische manifest-check gestart");

  const files = [
    "index.html","results.html","company.html","dashboard.html","admin.html",
    "login.html","register.html","password-forgot.html","password-reset.html",
    "password-reset-success.html","ad-company.html","email-confirmation.html",
    "request.html","error.html","status.html"
  ];

  const snippet = `<link rel="manifest" href="manifest.json" />`;

  for (const f of files) {
    try {
      const res = await fetch(f, { cache: "no-store" });
      const html = await res.text();

      if (html.includes('rel="manifest"')) {
        console.log(`✅ ${f} bevat al een manifest-link`);
        continue;
      }

      const updated = html.replace(
        /(<link[^>]+favicon[^>]*>)/i,
        `$1\n  ${snippet}`
      );

      if (updated === html) {
        console.warn(`⚠️ ${f}: geen favicon gevonden, handmatig toevoegen`);
      } else {
        console.group(`✏️ ${f}`);
        console.log("→ Voeg toe direct onder favicon:");
        console.log(snippet);
        console.groupEnd();
      }
    } catch (err) {
      console.error(`❌ Kon ${f} niet ophalen:`, err.message);
    }
  }

  console.log("✨ Klaar. Bekijk de console voor welke bestanden zijn aangepast of nog ontbreken.");
})();
