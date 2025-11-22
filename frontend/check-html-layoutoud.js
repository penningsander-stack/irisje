// frontend/check-html-layout.js
import fs from "fs";
import path from "path";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");
let fixedCount = 0;

console.log("🔍 Bezig met scannen van HTML-bestanden...\n");

function fixFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // ✅ Voeg css/common.css toe als die ontbreekt
  if (!html.includes('css/common.css')) {
    html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="css/common.css">\n</head>');
    changed = true;
  }

  // ✅ Voeg js/layout.js toe als die ontbreekt
  if (!html.includes('js/layout.js')) {
    html = html.replace(/<\/body>/i, '  <script src="js/layout.js" defer></script>\n</body>');
    changed = true;
  }

  if (changed) {
    const backupPath = path.join(backupDir, path.basename(filePath));
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`🛠️  Hersteld + backup gemaakt: ${path.basename(filePath)}`);
    fixedCount++;
  }
}

const files = fs.readdirSync(rootDir).filter(f => f.endsWith(".html"));

for (const file of files) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, "utf8");
  const missingItems = [];

  if (!content.includes('css/common.css')) missingItems.push("common.css");
  if (!content.includes('js/layout.js')) missingItems.push("layout.js");

  if (missingItems.length) fixFile(filePath);
}

if (fixedCount === 0) {
  console.log("✅ Alles in orde! Geen ontbrekende layout-referenties gevonden.\n");
} else {
  console.log(`\n✨ ${fixedCount} bestand(en) automatisch hersteld.\n`);
}
