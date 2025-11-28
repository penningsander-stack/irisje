/* frontend/auto-add-manifest-and-sw.js
   🌸 Irisje.nl – controleert automatisch manifest + service worker
   Gebruik: open https://irisje.nl/auto-add-manifest-and-sw.js in je browserconsole
*/

(async () => {
  console.log("🌼 Irisje.nl – controle manifest & service worker gestart");

  const files = [
    "index.html","results.html","company.html","dashboard.html","admin.html",
    "login.html","register.html","password-forgot.html","password-reset.html",
    "password-reset-success.html","ad-company.html","email-confirmation.html",
    "request.html","error.html","status.html"
  ];

  const manifestSnippet = `<link rel="manifest" href="manifest.json" />`;
  const swSnippet = `<script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(()=>console.log('✅ Service worker actief'))
        .catch(err=>console.error('SW fout:',err));
    }
  </script>`;

  for (const f of files) {
    try {
      const res = await fetch(f, { cache: "no-store" });
      const html = await res.text();

      const hasManifest = html.includes('rel="manifest"');
      const hasSW = html.includes("navigator.serviceWorker");

      if (!hasManifest || (f === "index.html" && !hasSW)) {
        console.group(`✏️ ${f}`);
        if (!hasManifest) {
          console.log("→ Voeg toe direct onder favicon:");
          console.log(manifestSnippet);
        }
        if (f === "index.html" && !hasSW) {
          console.log("→ Voeg toe onderaan <body> vóór </html>:");
          console.log(swSnippet);
        }
        console.groupEnd();
      } else {
        console.log(`✅ ${f} is volledig in orde`);
      }
    } catch (err) {
      console.error(`❌ Kon ${f} niet controleren: ${err.message}`);
    }
  }

  console.log("✨ Klaar. Bekijk console-output voor eventuele ontbrekende regels.");
})();
