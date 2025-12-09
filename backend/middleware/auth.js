// backend/middleware/auth.js
// v20251213-AUTH-FIX-ADMIN-COMPAT
//
// Doel:
// - Eén centrale JWT-middleware voor ALLE routes.
// - Werkt met:
//     1) cookies:    req.cookies.token
//     2) headers:    Authorization: Bearer <token>
// - Compatibel met zowel:
//     const auth = require("../middleware/auth");
//     const { authMiddleware, requireAdmin, requireCompany } = require("../middleware/auth");
//
// Let op:
// - req.user wordt gezet op de gedecodeerde payload (id, role, companyId, etc.).

const jwt = require("jsonwebtoken");

/**
 * Basis authenticatie-middleware.
 * - Leest eerst token uit cookie "token"
 * - Zo niet aanwezig: probeert Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  try {
    let token = null;

    // 1) Cookie-token (bijv. voor normale dashboard-sessies)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2) Authorization header (bijv. voor adminToken vanuit localStorage)
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization || "";
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Geen token meegegeven",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[authMiddleware] JWT_SECRET ontbreekt in environment.");
      return res.status(500).json({
        ok: false,
        error: "Serverconfiguratie onvolledig (JWT_SECRET)",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        ok: false,
        error: "Ongeldige token",
      });
    }

    // Bewaar payload op req.user voor vervolg middleware / routes
    req.user = decoded;
    next();
  } catch (err) {
    console.error("[authMiddleware] Fout bij token-verificatie:", err.message);
    return res.status(401).json({
      ok: false,
      error: "Ongeldige of verlopen token",
    });
  }
}

/**
 * Alleen admin toegestaan.
 * - Combineert authMiddleware + rol-check
 */
function requireAdmin(req, res, next) {
  return authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "Alleen admin toegestaan",
      });
    }
    next();
  });
}

/**
 * Alleen bedrijf toegestaan.
 * - Combineert authMiddleware + rol-check + companyId-check
 */
function requireCompany(req, res, next) {
  return authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== "company" || !req.user.companyId) {
      return res.status(403).json({
        ok: false,
        error: "Alleen bedrijven toegestaan",
      });
    }
    next();
  });
}

/**
 * Export compatibel met beide stijlen:
 *  - module.exports = authMiddleware;
 *  - module.exports.authMiddleware = authMiddleware;
 */
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireAdmin = requireAdmin;
module.exports.requireCompany = requireCompany;
