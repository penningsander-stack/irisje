/**
 * irisje.nl – security & cors configuratie
 */

const cors = require("cors");

/* toegestane origins */
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "https://irisje-frontend.onrender.com",
  "https://irisje-frontendnieuw.onrender.com",
  "https://irisje-backend.onrender.com",
];

/* cors middleware */
const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    console.warn("🚫 [cors] geblokkeerde origin:", origin);
    return cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
});

/* security headers */
function securityHeaders(req, res, next) {
  if (req.path.endsWith(".html")) {
    res.setHeader("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("pragma", "no-cache");
    res.setHeader("expires", "0");
  } else if (/\.(css|js|png|jpg|jpeg|svg|webp|ico)$/i.test(req.path)) {
    res.setHeader("cache-control", "public, max-age=31536000, immutable");
  }

  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "sameorigin");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");

  res.setHeader(
    "content-security-policy",
    "default-src 'self' https:; frame-ancestors 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );

  res.setHeader(
    "permissions-policy",
    "geolocation=(), camera=(), microphone=(), browsing-topics=()"
  );

  next();
}

module.exports = {
  corsMiddleware,
  securityHeaders,
};