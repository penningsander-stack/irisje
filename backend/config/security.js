// backend/config/security.js
/**
 * 🌸 Irisje.nl – Security & CORS configuratie
 * Bundelt alle beveiligingsheaders, CORS-instellingen en cache-regels.
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
 */
const corsMiddleware = cors({
  origin: (origin, cb) =>
    !origin || allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Niet-toegestane bron: " + origin)),
  credentials: true
});

/**
 * 🛡️ Beveiligings- en cache-headers
 */
function securityHeaders(req, res, next) {
  // Cache-beleid
  if (req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else if (/\.(css|js|png|jpg|jpeg|svg|webp|ico)$/i.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  // Security-headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
}

module.exports = { corsMiddleware, securityHeaders };
