/**
 * irisje.nl – security & cors configuratie
 * volledig opgeschoond en consistent gemaakt – 2025-11-13
 */

const cors = require("cors");

/* ============================================================
   toegestane origins
============================================================ */
const allowedorigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "https://irisje-frontend.onrender.com",
  "https://irisje-backend.onrender.com" // backend moet zichzelf kunnen aanroepen
];

/* ============================================================
   cors middleware
   - alles in kleine letters
   - backend toegestaan
   - nette console waarschuwing
============================================================ */
const corsemiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedorigins.includes(origin)) {
      return cb(null, true);
    }
    console.warn("🚫 [cors] geblokkeerde origin:", origin);
    return cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200
});

/* ============================================================
   security headers
   moderne en veilige set
============================================================ */
function securityheaders(req, res, next) {
  /* cache control */
  if (req.path.endsWith(".html")) {
    res.setHeader("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("pragma", "no-cache");
    res.setHeader("expires", "0");
  } else if (/\.(css|js|png|jpg|jpeg|svg|webp|ico)$/i.test(req.path)) {
    res.setHeader("cache-control", "public, max-age=31536000, immutable");
  }

  /* moderne security headers */
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "sameorigin");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");

  /* x-xss-protection is deprecated → we zetten moderne csp in */
  res.setHeader(
    "content-security-policy",
    "default-src 'self' https:; frame-ancestors 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );

  /* nieuwe permissions-policy */
  res.setHeader(
    "permissions-policy",
    "geolocation=(), camera=(), microphone=(), browsing-topics=()"
  );

  next();
}

/* ============================================================
   exports (kleine letters)
============================================================ */
module.exports = {
  corsemiddleware,
  securityheaders
};
