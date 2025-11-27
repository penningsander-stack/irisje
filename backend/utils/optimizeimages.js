// backend/utils/optimizeImages.js
/**
 * Automatische afbeeldingsoptimalisatie voor Irisje.nl
 * - comprimeert JPG/PNG
 * - maakt .webp-versie indien kleiner
 * - overslaat bestaande webp-bestanden
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = path.join(__dirname, "../../frontend/img");

async function optimizeImages(dir = inputDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await optimizeImages(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;

    const webpPath = fullPath.replace(ext, ".webp");
    if (fs.existsSync(webpPath)) {
      console.log(`✅ WebP bestaat al: ${entry.name}`);
      continue;
    }

    try {
      const img = sharp(fullPath);
      const metadata = await img.metadata();

      const webpBuffer = await img.webp({ quality: 80 }).toBuffer();
      const origSize = fs.statSync(fullPath).size;
      const webpSize = webpBuffer.length;

      if (webpSize < origSize * 0.95) {
        fs.writeFileSync(webpPath, webpBuffer);
        console.log(`🪄 Geoptimaliseerd → ${path.basename(webpPath)} (${Math.round(webpSize / 1024)} KB)`);
      } else {
        console.log(`ℹ️ Geen winst bij: ${entry.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Fout bij ${entry.name}:`, err.message);
    }
  }
}

optimizeImages().then(() => console.log("✅ Afbeeldingsoptimalisatie voltooid."));
