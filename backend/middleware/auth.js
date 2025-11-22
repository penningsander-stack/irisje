// backend/middleware/auth.js
// v20251122-REBUILD-AUTH-COMPAT
// Compatibel met:
// 1) const auth = require("../middleware/auth")
// 2) const { authMiddleware, requireAdmin, requireCompany } = require("../middleware/auth")

const jwt = require("jsonwebtoken");

/**
 * ✅ Basismiddleware: controleert JWT
 * - Eerst cookie "token"
 * - Daarna fallback naar Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  try {
    let token = req.cookies?.token;

    // Fallback: Authorization header
    if (!token) {
      const authHeader =
        req.headers?.authorization || req.headers?.Authorization;
      if (
        typeof authHeader === "string" &&
        authHeader.startsWith("Bearer ")
      ) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Niet ingelogd (geen token aanwezig)",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("❌ Auth error:", err?.message || err);
    return res.status(401).json({
      ok: false,
      error: "Ongeldige of verlopen sessie",
    });
  }
}

/**
 * ✅ Alleen admin
 */
function requireAdmin(req, res, next) {
  return authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "Alleen admin toegestaan",
      });
    }
    next();
  });
}

/**
 * ✅ Alleen company
 */
function requireCompany(req, res, next) {
  return authMiddleware(req, res, () => {
    if (req.user?.role !== "company") {
      return res.status(403).json({
        ok: false,
        error: "Alleen bedrijven toegestaan",
      });
    }
    next();
  });
}

/**
 * ♻️ Export compatibel met beide stijlen
 */
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireAdmin = requireAdmin;
module.exports.requireCompany = requireCompany;
