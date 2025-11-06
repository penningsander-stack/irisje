// tools/update-html.js
// Script om alle .html bestanden te voorzien van de common layout-includes

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd(); // repo-root in GitHub Actions
const TARGET_DIR = path.join(ROOT, "frontend"); // jij hebt al je html daar
const LINK_TAG = `<link rel="stylesheet" href="css/common.css">`;
const SCRIPT_TAG = `<script src="js/layout.js" defer></script>`;

// welke bestanden willen we meenemen?
const exts = [".html", ".htm"];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function ensureTag(html, tag, before) {
  if (html.includes(tag)) return html; // staat er al
  return html.replace(before, `${tag}\n${before}`);
}

function processFile(file) {
  let html = fs.readFileSync(file, "utf8");
  const orig = html;

  // voeg <link> vlak vóór </head> toe
  if (html.includes("</head>")) {
    html = ensureTag(html, LINK_TAG, "</head>");
  }

  // voeg <script> vlak vóór </body> toe
  if (html.includes("</body>")) {
    html = ensureTag(html, SCRIPT_TAG, "</body>");
  }

  if (html !== orig) {
    fs.writeFileSync(file, html, "utf8");
    console.log("✅ bijgewerkt:", path.relative(ROOT, file));
    return true;
  } else {
    console.log("— geen wijziging:", path.relative(ROOT, file));
    return false;
  }
}

function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.error("⚠️ map 'frontend' niet gevonden");
    process.exit(1);
  }

  const files = walk(TARGET_DIR);
  console.log("🔎 gevonden html-bestanden:", files.length);

  let changed = 0;
  for (const file of files) {
    if (processFile(file)) changed++;
  }

  console.log(`✅ Klaar. ${changed} bestand(en) aangepast.`);
}

main();
