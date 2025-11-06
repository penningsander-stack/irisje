// frontend/update-html.js
import fs from "fs";
import path from "path";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_html");
const cssLine = `<link rel="stylesheet" href="css/common.css">`;
const jsLine = `<script src="js/layout.js" defer></script>`;

// 🧱 Back-upmap aanmaken
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// 🔁 Recursieve functie om HTML-bestanden te vinden en aan te passen
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      scanDir(fullPath); // submap in
    } else if (file.endsWith(".html")) {
      backupAndUpdate(fullPath);
    }
  }
}

function backupAndUpdate(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  const backupPath = path.join(backupDir, relativePath);

  // Back-up maken
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(filePath, backupPath);

  // Inhoud bewerken
  let content = fs.readFileSync(filePath, "utf8");
  let updated = false;

  if (!content.includes(cssLine)) {
    content = content.replace(/<head([^>]*)>/i, `<head$1>\n  ${cssLine}`);
    updated = true;
  }

  if (!content.includes(jsLine)) {
    content = content.replace(/<\/body>/i, `  ${jsLine}\n</body>`);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Bijgewerkt: ${relativePath}`);
  } else {
    console.log(`— Overgeslagen (al up-to-date): ${relativePath}`);
  }
}

scanDir(rootDir);
console.log("✨ Alle HTML-bestanden zijn gecontroleerd, geback-upt en bijgewerkt.");
