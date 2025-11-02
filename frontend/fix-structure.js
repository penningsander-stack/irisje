// frontend/fix-structure.js
// ✅ Irisje.nl – Automatisch toevoegen van manifest + service worker aan alle HTML-bestanden

import fs from "fs";
import path from "path";

const folder = "./frontend";
const files = fs.readdirSync(folder).filter(f => f.endsWith(".html"));

const manifestTag = `<link rel="manifest" href="manifest.json" />`;
const swScript = `
  <!-- ✅ Service Worker -->
  <script>
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js")
        .then(() => console.log("✅ Service worker geregistreerd."))
        .catch(err => console.error("Service worker fout:", err));
    }
  </script>`;

for (const file of files) {
  const filePath = path.join(folder, file);
  let html = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 🟢 Manifest: voeg toe na favicon of theme-color (fallback: einde head)
  if (!html.includes('rel="manifest"')) {
    if (/<link[^>]+favicon[^>]*>/i.test(html)) {
      html = html.replace(/(<link[^>]+favicon[^>]*>)/i, `$1\n  ${manifestTag}`);
    } else if (/<meta[^>]+theme-color/i.test(html)) {
      html = html.replace(/(<meta[^>]+theme-color[^>]*>)/i, `$1\n  ${manifestTag}`);
    } else {
      html = html.replace(/<\/head>/i, `  ${manifestTag}\n</head>`);
    }
    changed = true;
  }

  // 🟢 Service worker: voeg toe voor </body>
  if (!html.includes("navigator.serviceWorker")) {
    html = html.replace(/<\/body>/i, `${swScript}\n</body>`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`✏️ Aangepast: ${file}`);
  } else {
    console.log(`✅ ${file} al in orde`);
  }
}

console.log("✨ Alles is gecontroleerd en waar nodig automatisch aangepast.");
