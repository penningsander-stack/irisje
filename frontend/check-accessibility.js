/* frontend/check-accessibility.js
   Gebruik: open https://irisje.nl/check-accessibility.js in je browserconsole
   → controleert automatisch of alle HTML-bestanden voldoen aan basis toegankelijkheids-
     en compatibiliteitsregels (lang, title, meta viewport, charset).
*/

(async () => {
  console.log("🌸 Irisje.nl – Accessibility & Meta-controle gestart");

  const files = [
    "index.html","results.html","company.html","dashboard.html","admin.html",
    "login.html","register.html","password-forgot.html","password-reset.html",
    "password-reset-success.html","ad-company.html","email-confirmation.html",
    "request.html","error.html","status.html"
  ];

  for (const f of files) {
    try {
      const res = await fetch(f, { cache: "no-store" });
      const html = await res.text();

      const issues = [];

      if (!html.match(/<html[^>]*lang\s*=\s*["']nl["']/i))
        issues.push("❌ mist <html lang=\"nl\">");
      if (!html.match(/<title>.*<\/title>/i))
        issues.push("❌ mist <title>");
      if (!html.match(/<meta[^>]+name=["']viewport["']/i))
        issues.push("❌ mist <meta name=\"viewport\">");
      if (!html.match(/<meta[^>]+charset=["']utf-8["']/i))
        issues.push("❌ mist <meta charset=\"UTF-8\">");

      if (issues.length === 0) {
        console.log(`✅ ${f} is in orde`);
      } else {
        console.group(`⚠️ ${f}`);
        issues.forEach(i => console.log(i));
        console.groupEnd();
      }
    } catch (err) {
      console.error(`❌ Kon ${f} niet controleren:`, err.message);
    }
  }

  console.log("✨ Controle voltooid. Bekijk de console-uitvoer hierboven voor details.");
})();
