/**
 * 🌸 Irisje.nl – Dynamische sitemap generator
 * Directe handler voor /sitemap.xml
 */

const fs = require("fs");
const path = require("path");

// === Basisinstellingen ===
const FRONTEND_DIR = path.join(__dirname, "../../frontend"); // ✅ iets netter genormaliseerd
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
    const urls = PUBLIC_PAGES.filter((file) => {
      // Alleen opnemen als bestand daadwerkelijk bestaat
      return fs.existsSync(path.join(FRONTEND_DIR, file));
    }).map((file) => {
      // index.html → "/", anders /bestandsnaam
      return file === "index.html" ? "/" : `/${file.replace(".html", "")}`;
    });

    if (urls.length === 0) {
      console.warn("⚠️ [Sitemap] Geen publieke frontendbestanden gevonden.");
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

    res
      .status(200)
      .type("application/xml")
      .set("Cache-Control", "public, max-age=86400") // ✅ 1 dag cache
      .send(xml);
  } catch (err) {
    console.error("❌ [Sitemap] Fout bij genereren:", err);
    res.status(500).send("Fout bij genereren sitemap.xml");
  }
};
