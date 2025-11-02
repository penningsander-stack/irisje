// frontend/fix-html.js
// Irisje.nl – automatische toevoeging van manifest & service worker

import fs from "fs";
import path from "path";

const folder = "./frontend";
const manifestSnippet = `<link rel="manifest" href="manifest.json" />`;
const swSnippet = `
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(()=>console.log('✅ Service worker actief'))
    .catch(err=>console.error('SW fout:', err));
}
</script>
`;

const htmlFiles = fs.readdirSync(folder).filter(f => f.endsWith(".html"));

for (const file of htmlFiles) {
  const filePath = path.join(folder, file);
  let html = fs.readFileSync(filePath, "utf8");

  let changed = false;

  // 🔹 Manifest toevoegen na favicon
  if (!html.includes('rel="manifest"')) {
    html = html.replace(
      /(<link[^>]+rel=["']icon["'][^>]*>)/i,
      `$1\n  ${manifestSnippet}`
    );
    changed = true;
  }

  // 🔹 Alleen bij index.html: service worker toevoegen
  if (file === "index.html" && !html.includes("navigator.serviceWorker")) {
    html = html.replace(
      /<\/body>/i,
      `${swSnippet}\n</body>`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`✏️ Aangepast: ${file}`);
  } else {
    console.log(`✅ Geen wijziging nodig: ${file}`);
  }
}

console.log("✨ Klaar! Alle HTML-bestanden zijn gecontroleerd en bijgewerkt.");
