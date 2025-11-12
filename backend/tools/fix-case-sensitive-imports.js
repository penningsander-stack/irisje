// backend/tools/fix-case-sensitive-imports.js
/**
 * 🧩 Irisje.nl – Auto-fixer voor hoofdlettergevoelige require() en import-paden
 * Voert case-correcties uit op bestanden én code, zodat Render (Linux) geen MODULE_NOT_FOUND meer gooit.
 *
 * Gebruik:
 *   node backend/tools/fix-case-sensitive-imports.js
 */

const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;

const ROOT = path.join(__dirname, "..");
const ALL_FILES = [];

/* === Recursief alle JS-bestanden vinden === */
function collectFiles(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collectFiles(full);
    else if (file.endsWith(".js")) ALL_FILES.push(full);
  }
}

/* === Hulpfunctie: converteer bestandsnaam naar lowercase === */
function safeRename(file) {
  const lower = path.join(path.dirname(file), path.basename(file).toLowerCase());
  if (file !== lower && !fs.existsSync(lower)) {
    console.log(`↘️ Renaming ${file} → ${lower}`);
    fs.renameSync(file, lower);
  }
}

/* === Hoofdfunctie === */
function fixImports() {
  console.log("🔍 Scannen op hoofdlettergevoelige imports...");
  collectFiles(ROOT);

  for (const file of ALL_FILES) {
    let content = fs.readFileSync(file, "utf8");
    let changed = false;

    const regex = /require\(["'`](.*?)["'`]\)|import .*? from ["'`](.*?)["'`]/g;
    let match;
    while ((match = regex.exec(content))) {
      const relPath = match[1] || match[2];
      if (!relPath || !relPath.startsWith(".")) continue;
      if (relPath.startsWith("http") || relPath.startsWith("@")) continue;

      const absPath = path.resolve(path.dirname(file), relPath);
      const targetDir = path.dirname(absPath);
      const targetName = path.basename(absPath);
      const fullFile = fs.existsSync(absPath + ".js")
        ? absPath + ".js"
        : fs.existsSync(absPath)
        ? absPath
        : null;

      // hernoem fysiek bestand naar lowercase
      if (fullFile) safeRename(fullFile);

      // pas codepad aan naar lowercase
      const lowerRel = relPath.replace(/([A-Z])/g, (c) => c.toLowerCase());
      if (lowerRel !== relPath) {
        const oldContent = content;
        const search = new RegExp(relPath, "g");
        content = content.replace(search, lowerRel);
        if (content !== oldContent) {
          console.log(`✏️  ${path.relative(ROOT, file)} → ${relPath} → ${lowerRel}`);
          changed = true;
        }
      }
    }

    if (changed) fs.writeFileSync(file, content, "utf8");
  }

  console.log("✅ Alle imports en bestandsnamen zijn gecontroleerd en waar nodig aangepast.");
}

fixImports();

// Automatisch committen als er wijzigingen zijn
try {
  const status = execSync("git status --porcelain").toString().trim();
  if (status) {
    console.log("💾 Wijzigingen gevonden – commit en push uitvoeren...");
    execSync('git config user.name "Irisje AutoFixer"');
    execSync('git config user.email "bot@irisje.nl"');
    execSync("git add .");
    execSync('git commit -m "fix: normalize case-sensitive imports and filenames"');
    execSync("git push");
    console.log("🚀 Wijzigingen gepusht.");
  } else {
    console.log("✨ Geen wijzigingen nodig.");
  }
} catch (err) {
  console.warn("⚠️ Git commit mislukt of niet toegestaan:", err.message);
}
