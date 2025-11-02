// frontend/fix-structure.js
// ✅ Irisje.nl - Automatisch toevoegen van manifest + service worker
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

  // 1️⃣ Manifest toevoegen in <head>
  if (!html.includes('rel="manifest"')) {
    html = html.replace(/(<link[^>]+href=["'][^"']*favicon[^>]+>)/i, `$1\n  ${manifestTag}`);
    changed = true;
  }

  // 2️⃣ Service worker-script controleren of toevoegen
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

console.log("✨ Alle HTML-bestanden zijn gecontroleerd en waar nodig aangepast.");
