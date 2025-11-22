// backend/middleware/auth.js
// v20251118 – JWT Authorization Header Middleware

const jwt = require("jsonwebtoken");

/**
 * 🔐 Algemene authenticatiemiddleware
 * Controleert:
 *  - Authorization: Bearer <token>
 *  - geldigheid van token
 *  - payload: { id, role, companyId }
 *
 * Succes:
 *  - req.user = { id, role, companyId }
 *
 * Fout:
 *  - 401 met duidelijke foutmelding
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");

    // Verwachte vorm: "Bearer <token>"
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        ok: false,
        error: "Geen geldige autorisatie-header.",
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Geen token gevonden.",
      });
    }

    // Token controleren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded bevat bijv.: { id, role, companyId, iat, exp }
    req.user = {
      id: decoded.id,
      role: decoded.role,
      companyId: decoded.companyId || null,
    };

    return next();
  } catch (err) {
    console.error("❌ JWT Auth error:", err?.message || err);

    return res.status(401).json({
      ok: false,
      error: "Ongeldig of verlopen token.",
    });
  }
}

/**
 * 🔒 Optionele middleware voor admin-only routes
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      ok: false,
      error: "Toegang geweigerd. Admin-rechten vereist.",
    });
  }
  next();
}

/**
 * 🔒 Optionele middleware voor ingelogde bedrijven
 */
function requireCompany(req, res, next) {
  if (!req.user || req.user.role !== "company") {
    return res.status(403).json({
      ok: false,
      error: "Toegang geweigerd. Bedrijfsaccount vereist.",
    });
  }
  next();
}

module.exports = {
  authMiddleware,
  requireAdmin,
  requireCompany,
};
