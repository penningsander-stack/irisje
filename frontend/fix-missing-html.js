// frontend/fix-missing-html.js
import fs from "fs";
import path from "path";
import readline from "readline";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");

// 🛠️ Functie om bestanden te herstellen
function fixHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (!file.startsWith("backup_fixed_html")) fixHtmlFiles(fullPath);
      continue;
    }

    if (file.endsWith(".html")) {
      const html = fs.readFileSync(fullPath, "utf8");

      // Controleer of <link> en <script> ontbreken
      const needsCss = !html.includes('css/common.css');
      const needsJs = !html.includes('js/layout.js');

      if (!needsCss && !needsJs) return;

      // Maak backup-map aan
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

// 🧠 Bevestigingsvraag
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "⚠️  Weet je zeker dat je alle HTML-bestanden wilt controleren en aanvullen met layout.js en common.css? (j/n) ",
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
