// frontend/fix-missing-html.js
import fs from "fs";
import path from "path";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");

const cssLine = `<link rel="stylesheet" href="css/common.css">`;
const jsLine = `<script src="js/layout.js" defer></script>`;

// 📁 Zorg dat back-upmap bestaat
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Doorloopt alle submappen van frontend/
 */
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".html")) {
      fixFile(fullPath);
    }
  }
}

/**
 * Controleer + repareer één HTML-bestand
 */
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const relative = path.relative(rootDir, filePath);

  let changed = false;

  // Voeg CSS toe in <head>
  if (!content.includes(cssLine)) {
    const headMatch = content.match(/<head[^>]*>/i);
    if (headMatch) {
      content = content.replace(headMatch[0], `${headMatch[0]}\n  ${cssLine}`);
      changed = true;
    }
  }

  // Voeg JS toe vóór </body>
  if (!content.includes(jsLine)) {
    const bodyMatch = content.match(/<\/body>/i);
    if (bodyMatch) {
      content = content.replace(bodyMatch[0], `  ${jsLine}\n${bodyMatch[0]}`);
      changed = true;
    }
  }

  if (changed) {
    // 📦 Backup maken (zelfde structuur)
    const backupPath = path.join(backupDir, relative);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(filePath, backupPath);

    // Overschrijven met nieuwe inhoud
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`🛠️  Hersteld + backup gemaakt: ${relative}`);
  } else {
    console.log(`✅ In orde: ${relative}`);
  }
}

scanDir(rootDir);
console.log("✨ Controle + herstel met backup voltooid!");
