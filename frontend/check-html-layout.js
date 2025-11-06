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

const missing = [];

for (const file of files) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  const missingItems = [];
  if (!content.includes('css/common.css')) missingItems.push("common.css");
  if (!content.includes('js/layout.js')) missingItems.push("layout.js");

  if (missingItems.length) {
    missing.push({ file, missing: missingItems });
    fixFile(filePath);
  }
}

if (!missing.length) {
  console.log("✅ Alles in orde! Alle HTML-bestanden bevatten common.css en layout.js.");
} else {
  console.log("\n📋 Controle + herstel voltooid.");
  console.log(`✨ ${fixedCount} bestand(en) automatisch hersteld.\n`);
}
