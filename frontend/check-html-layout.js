// frontend/check-html-layout.js
import fs from "fs";
import path from "path";

const rootDir = "./frontend";
const skipDirs = ["js", "css", "dist", "backup_fixed_html", "node_modules"];

let missingCss = [];
let missingJs = [];

function checkHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (!skipDirs.includes(file)) checkHtmlFiles(fullPath);
      continue;
    }

    if (file.endsWith(".html")) {
      const html = fs.readFileSync(fullPath, "utf8");
      const relPath = path.relative(rootDir, fullPath);

      if (!html.includes("css/common.css")) missingCss.push(relPath);
      if (!html.includes("js/layout.js")) missingJs.push(relPath);
    }
  }
}

console.log("🔍 Bezig met scannen van HTML-bestanden...\n");
checkHtmlFiles(rootDir);

if (missingCss.length === 0 && missingJs.length === 0) {
  console.log("✅ Alles is in orde! Alle HTML-bestanden bevatten common.css en layout.js.");
} else {
  if (missingCss.length) {
    console.log("\n⚠️  Ontbrekende 'css/common.css' in:");
    missingCss.forEach(f => console.log("  -", f));
  }
  if (missingJs.length) {
    console.log("\n⚠️  Ontbrekende 'js/layout.js' in:");
    missingJs.forEach(f => console.log("  -", f));
  }
  console.log("\n📋 Controle voltooid.");
}
