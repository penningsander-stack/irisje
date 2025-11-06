// frontend/fix-missing-html.js
import fs from "fs";
import path from "path";
import readline from "readline";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");

// ❌ Mappen die we overslaan
const skipDirs = ["js", "css", "dist", "backup_fixed_html", "node_modules"];

function fixHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (!skipDirs.includes(file)) {
        fixHtmlFiles(fullPath);
      }
      continue;
    }

    if (file.endsWith(".html")) {
      const html = fs.readFileSync(fullPath, "utf8");

      const needsCss = !html.includes('css/common.css');
      const needsJs = !html.includes('js/layout.js');

      if (!needsCss && !needsJs) return;

      const relPath = path.relative(rootDir, fullPath);
      const backupPath = path.join(backupDir, relPath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(fullPath, backupPath);

      let fixed = html;
      if (needsCss) {
        fixed = fixed.replace(
          /<\/head>/i,
          '  <link rel="stylesheet" href="css/common.css">\n</head>'
        );
      }
      if (needsJs) {
        fixed = fixed.replace(
          /<\/body>/i,
          '  <script src="js/layout.js" defer></script>\n</body>'
        );
      }

      fs.writeFileSync(fullPath, fixed, "utf8");
      console.log(`🛠️  Hersteld + backup gemaakt: ${relPath}`);
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "⚠️  Weet je zeker dat je ALLE HTML-bestanden (behalve in js/css/dist) wilt controleren en aanvullen met layout.js en common.css? (j/n) ",
  (answer) => {
    if (answer.toLowerCase() === "j") {
      console.log("🔍 Controle en herstel gestart...");
      fs.mkdirSync(backupDir, { recursive: true });
      fixHtmlFiles(rootDir);
      console.log("✅ Controle + herstel met backup voltooid!");
    } else {
      console.log("🚫 Bewerking geannuleerd.");
    }
    rl.close();
  }
);
