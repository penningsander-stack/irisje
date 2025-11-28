// frontend/rollback-html.js
import fs from "fs";
import path from "path";
import readline from "readline";

const rootDir = "./frontend";
const backupDir = path.join(rootDir, "backup_fixed_html");

if (!fs.existsSync(backupDir)) {
  console.error("❌ Geen back-upmap gevonden:", backupDir);
  process.exit(1);
}

function restoreDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      restoreDir(fullPath);
    } else if (file.endsWith(".html")) {
      const relPath = path.relative(backupDir, fullPath);
      const targetPath = path.join(rootDir, relPath);
      fs.copyFileSync(fullPath, targetPath);
      console.log(`🔁 Teruggezet: ${relPath}`);
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("⚠️  Weet je zeker dat je alle HTML-bestanden wilt terugzetten uit de back-up? (j/n) ", (answer) => {
  if (answer.toLowerCase() === "j") {
    console.log("♻️  Terugzetten gestart...");
    restoreDir(backupDir);
    console.log("✅ Terugzetten voltooid! Alle HTML-bestanden zijn hersteld uit de back-up.");
  } else {
    console.log("🚫 Terugzetten geannuleerd.");
  }
  rl.close();
});
