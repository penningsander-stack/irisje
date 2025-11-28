// frontend/fix-missing-html.js
import fs from "fs";
import path from "path";
import readline from "readline";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");

// Alleen deze bestanden fixen (zoals uit je scan)
const targetFiles = [
  "ad-company.html","admin.html","company.html","components-preview.html","contact.html",
  "dashboard.html","email-confirmation.html","email-verification-error.html","error.html",
  "forgot.html","index.html","login.html","maintenance.html","offline.html","over.html",
  "password-forgot.html","password-reset-success.html","password-reset.html","privacy.html",
  "register.html","request.html","reset-password.html","results.html","status.html",
  "style-guide.html","voorwaarden.html"
];

function fixFile(filename) {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Bestand niet gevonden: ${filename}`);
    return;
  }

  let html = fs.readFileSync(filePath, "utf8");
  const needsCss = !html.includes('css/common.css');
  const needsJs = !html.includes('js/layout.js');
  if (!needsCss && !needsJs) return;

  // backup maken
  const backupPath = path.join(backupDir, filename);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(filePath, backupPath);

  // CSS toevoegen voor </head>
  if (needsCss) {
    html = html.replace(
      /<\/head>/i,
      '  <link rel="stylesheet" href="css/common.css">\n</head>'
    );
  }

  // JS toevoegen voor </body>
  if (needsJs) {
    html = html.replace(
      /<\/body>/i,
      '  <script src="js/layout.js" defer></script>\n</body>'
    );
  }

  fs.writeFileSync(filePath, html, "utf8");
  console.log(`🛠️  Hersteld + backup gemaakt: ${filename}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(
  "⚠️  Wil je alle ontbrekende layout-verwijzingen toevoegen in de 27 HTML-bestanden (met backup)? (j/n) ",
  (answer) => {
    if (answer.toLowerCase() === "j") {
      console.log("\n🔍 Start herstelproces...\n");
      fs.mkdirSync(backupDir, { recursive: true });
      targetFiles.forEach(fixFile);
      console.log("\n✅ Herstel compleet! Backups staan in /frontend/backup_fixed_html/");
    } else {
      console.log("🚫 Bewerking geannuleerd.");
    }
    rl.close();
  }
);
