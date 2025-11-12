// backend/routes/sitemap.js
/**
 * 🌸 Irisje.nl – Dynamische Sitemap Route
 * Doel: Automatisch sitemap.xml genereren met publieke pagina’s.
 * Wordt gebruikt door Google Search Console.
 */

import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// === Basisinstellingen ===
const FRONTEND_DIR = path.join(process.cwd(), "frontend");
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

// === Helperfunctie: XML genereren ===
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
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${xmlUrls}
</urlset>`;
}

// === Route /sitemap.xml ===
router.get("/", async (req, res) => {
  try {
    const urls = [];

    // Controleer of bestanden bestaan
    for (const file of PUBLIC_PAGES) {
      const filePath = path.join(FRONTEND_DIR, file);
      if (fs.existsSync(filePath)) {
        const route = file === "index.html" ? "/" : `/${file.replace(".html", "")}`;
        urls.push(route);
      }
    }

    const sitemapXml = buildSitemapXml(urls);

    res.header("Content-Type", "application/xml");
    res.send(sitemapXml);
  } catch (err) {
    console.error("❌ Fout bij genereren sitemap:", err);
    res.status(500).send("Fout bij genereren sitemap.xml");
  }
});

export default router;
