// frontend/check-structure.js
// ✅ Irisje.nl – controle manifest + service worker in alle HTML-bestanden

const fs = require("fs");
const path = require("path");

const folder = path.join(__dirname);
const files = fs.readdirSync(folder).filter(f => f.endsWith(".html"));

console.log("🔍 Irisje.nl – Controle gestart...\n");

let allOk = true;

for (const file of files) {
  const html = fs.readFileSync(path.join(folder, file), "utf8");
  const hasManifest = html.includes('rel="manifest"');
  const hasSW = html.includes("navigator.serviceWorker");

  if (hasManifest && hasSW) {
    console.log(`✅ ${file} is volledig in orde`);
  } else {
    allOk = false;
    console.group(`⚠️ ${file}`);
    if (!hasManifest) console.log("❌ mist manifest-link (<link rel=\"manifest\" ...>)");
    if (!hasSW) console.log("❌ mist service worker-script");
    console.groupEnd();
  }
}

if (allOk) {
  console.log("\n✨ Alles in orde! Alle HTML-bestanden bevatten manifest + service worker.\n");
} else {
  console.log("\n⚠️ Sommige bestanden missen nog onderdelen (zie boven).\n");
}
