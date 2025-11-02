/* frontend/fix-manifest.js
   Gebruik: open https://irisje.nl/fix-manifest.js in je browserconsole
   -> toont exact welke HTML-bestanden nog geen manifest/service worker hebben
*/

(async () => {
  console.log("Irisje.nl - controle manifest & service worker-links");

  const files = [
    "index.html","results.html","company.html","dashboard.html","admin.html",
    "login.html","register.html","password-forgot.html","password-reset.html",
    "password-reset-success.html","ad-company.html","email-confirmation.html",
    "request.html","error.html","status.html"
  ];

  const manifestSnippet = '<link rel="manifest" href="manifest.json" />';
  const swSnippet = `<script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(()=>console.log('Service worker actief'))
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
        console.group("Bestand: " + f);
        if (!hasManifest) {
          console.log("-> Voeg toe direct onder favicon:");
          console.log(manifestSnippet);
        }
        if (f === "index.html" && !hasSW) {
          console.log("-> Voeg onderaan <body> toe voor </html>:");
          console.log(swSnippet);
        }
        console.groupEnd();
      } else {
        console.log("OK: " + f + " is al in orde");
      }
    } catch (err) {
      console.error("Kon " + f + " niet controleren: " + err.message);
    }
  }

  console.log("Klaar. Zie console-output voor welke bestanden moeten worden aangepast.");
})();
