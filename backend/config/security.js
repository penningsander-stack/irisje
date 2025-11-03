// backend/config/security.js
/**
 * 🌸 Irisje.nl – Security & CORS configuratie
 * Centraal beheer van beveiligingsheaders, CORS en cacheregels.
 */

const cors = require("cors");

/**
 * 🌐 Toegestane origins (alleen frontends van Irisje.nl)
 */
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "https://irisje-frontend.onrender.com"
];

/**
 * ✅ CORS-middleware
 * - Staat alleen verzoeken toe van goedgekeurde frontends
 * - Logt geblokkeerde origins voor debugging
 */
const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      console.warn("🚫 [CORS] Geblokkeerde bron:", origin);
      cb(null, false); // geen error gooien → voorkomt 500-status
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
});

/**
 * 🛡️ Beveiligings- en cache-headers
 * - Blokkeert sniffing / framing / XSS
 * - Houdt HTML altijd vers, maar laat statische assets cachen
 */
function securityHeaders(req, res, next) {
  // Cachebeleid
  if (req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else if (/\.(css|js|png|jpg|jpeg|svg|webp|ico)$/i.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");

  next();
}

module.exports = { corsMiddleware, securityHeaders };
