// backend/routes/sitemap.js
/**
 * 🌸 Irisje.nl – Dynamische sitemap generator
 * Directe handler voor /sitemap.xml
 */

const fs = require("fs");
const path = require("path");

console.log("✅ [DEBUG] sitemap-handler geladen");

// === Basisinstellingen ===
const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend");
const BASE_URL = "https://irisje.nl";

// Alleen publieke HTML-pagina’s (géén admin/dashboard)
const PUBLIC_PAGES = [
  "index.html",
  "over.html",
  "contact.html",
  "request.html",
  "results.html",
  "privacy.html",
  "voorwaarden.html",
  "offline.html",
  "error.html",
];

/**
 * 🚀 Handlerfunctie voor /sitemap.xml
 */
module.exports = (req, res) => {
  try {
    const urls = [];

    for (const file of PUBLIC_PAGES) {
      const filePath = path.join(FRONTEND_DIR, file);
      if (fs.existsSync(filePath)) {
        const route = file === "index.html" ? "/" : `/${file.replace(".html", "")}`;
        urls.push(route);
      }
    }

    if (urls.length === 0) {
      console.warn("⚠️ Geen frontendbestanden gevonden voor sitemap.");
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${BASE_URL}${u}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("❌ Fout bij genereren sitemap:", err);
    res.status(500).send("Fout bij genereren sitemap.xml");
  }
};
