// frontend/update-html.js
import fs from "fs";
import path from "path";

const dir = "./"; // hoofdmap met je HTML-bestanden
const cssLine = `<link rel="stylesheet" href="css/common.css">`;
const jsLine = `<script src="js/layout.js" defer></script>`;

function updateHTML(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Voeg CSS toe vlak na <head> als het er nog niet staat
  if (!content.includes(cssLine)) {
    content = content.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  ${cssLine}`
    );
  }

  // Voeg JS toe vlak voor </body> als het er nog niet staat
  if (!content.includes(jsLine)) {
    content = content.replace(
      /<\/body>/i,
      `  ${jsLine}\n</body>`
    );
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Bijgewerkt: ${path.basename(filePath)}`);
}

// Alle HTML-bestanden doorlopen
fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith(".html")) {
    updateHTML(path.join(dir, file));
  }
});
