// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * ✅ Middleware om JWT-token in cookies te controleren
 * Verwacht een cookie "token" met payload { id, role }
 */
function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Niet ingelogd (geen token aanwezig)",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded bevat bijv. { id, role, iat, exp }
    req.user = decoded;

    next();
  } catch (err) {
    console.error("❌ Auth error:", err?.message || err);
    return res.status(401).json({
      ok: false,
      error: "Ongeldige of verlopen sessie",
    });
  }
}

module.exports = authMiddleware;
