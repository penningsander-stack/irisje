// frontend/check-html-layout.js
import fs from "fs";
import path from "path";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");
let fixedCount = 0;

console.log("🔍 Bezig met scannen en herstellen van HTML-bestanden...\n");

function fixFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  let changed = false;

  if (!html.includes('css/common.css')) {
    html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="css/common.css">\n</head>');
    changed = true;
  }

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
  if (!content.includes('css/common.css') || !content.includes('js/layout.js')) {
    fixFile(filePath);
  }
}

if (fixedCount === 0) {
  console.log("✅ Alles in orde! Geen ontbrekende layout-referenties gevonden.\n");
} else {
  console.log(`\n✨ ${fixedCount} bestand(en) automatisch hersteld.\n`);
}
