// backend/routes/sitemap.js
/**
 * 🌸 Irisje.nl – Dynamische Sitemap Route (CommonJS-versie)
 * Doel: Automatisch sitemap.xml genereren met publieke pagina’s.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

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
 * 🧩 Helperfunctie: XML genereren
 */
function buildSitemapXml(urls) {
  const xmlUrls = urls
    .map(
      (url) => `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === "/" ? "1.0" : "0.8"}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

/**
 * 🚀 Route /sitemap.xml
 */
router.get("/", (req, res) => {
  try {
    const urls = [];

    for (const file of PUBLIC_PAGES) {
      const filePath = path.join(FRONTEND_DIR, file);
      if (fs.existsSync(filePath)) {
        const route = file === "index.html" ? "/" : `/${file.replace(".html", "")}`;
        urls.push(route);
      }
    }

    // Geen bestanden gevonden → foutmelding loggen
    if (urls.length === 0) {
      console.warn("⚠️ Geen frontendbestanden gevonden voor sitemap.");
    }

    const sitemapXml = buildSitemapXml(urls);

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(sitemapXml);
  } catch (err) {
    console.error("❌ Fout bij genereren sitemap:", err);
    res.status(500).send("Fout bij genereren sitemap.xml");
  }
});

module.exports = router;
