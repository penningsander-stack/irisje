// frontend/fix-all-html.js
// 🪄 Automatische manifest + service worker toevoeging voor Irisje.nl
// Gebruik: node fix-all-html.js

import fs from "fs";
import path from "path";

const rootDir = "./frontend";
const manifestLine = `<link rel="manifest" href="manifest.json" />`;
const swSnippet = `
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('✅ Service worker actief'))
      .catch(err => console.error('SW fout:', err));
  }
</script>`;

const files = fs.readdirSync(rootDir).filter(f => f.endsWith(".html"));

for (const file of files) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  // Voeg manifest toe als het nog niet aanwezig is
  if (!content.includes('rel="manifest"')) {
    content = content.replace(
      /(<link[^>]+favicon\.ico[^>]*>\s*)/i,
      `$1\n  ${manifestLine}`
    );
    changed = true;
  }

  // Voeg service worker toe in index.html
  if (file === "index.html" && !content.includes("navigator.serviceWorker")) {
    content = content.replace(
      /<\/body>/i,
      `${swSnippet}\n</body>`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✏️  Aangepast: ${file}`);
  } else {
    console.log(`✅ In orde: ${file}`);
  }
}

console.log("✨ Klaar! Alle HTML-bestanden zijn gecontroleerd en waar nodig bijgewerkt.");
