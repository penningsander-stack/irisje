// backend/routes/sitemap.js
/**
 * 🌸 Irisje.nl – Dynamische sitemap generator (geoptimaliseerd)
 * Genereert automatisch sitemap.xml op basis van bestaande frontendbestanden.
 */

const fs = require("fs");
const path = require("path");

// === Basisinstellingen ===
const FRONTEND_DIR = path.join(__dirname, "../../frontend");

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
    const BASE_URL = `${req.protocol}://${req.get("host")}` || "https://irisje.nl";

    const urls = PUBLIC_PAGES.filter((file) => fs.existsSync(path.join(FRONTEND_DIR, file)))
      .map((file) => {
        const route = file === "index.html" ? "/" : `/${file.replace(".html", "")}`;
        const stats = fs.statSync(path.join(FRONTEND_DIR, file));
        const lastmod = stats.mtime.toISOString().split("T")[0]; // yyyy-mm-dd
        return { route, lastmod };
      });

    if (urls.length === 0) {
      console.warn("⚠️ [Sitemap] Geen publieke frontendbestanden gevonden.");
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${BASE_URL}${u.route}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.route === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

    res
      .status(200)
      .type("application/xml")
      .set("Cache-Control", "public, max-age=86400") // 1 dag caching
      .send(xml);

    console.log(`✅ [Sitemap] Verzonden (${urls.length} pagina’s)`);
  } catch (err) {
    console.error("❌ [Sitemap] Fout bij genereren:", err);
    res.status(500).send("Fout bij genereren sitemap.xml");
  }
};
