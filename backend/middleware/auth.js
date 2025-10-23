// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

// Verwacht een cookie "token" met een geldige JWT { id, role }
function verifyToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ ok: false, error: "Niet ingelogd (geen token)" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded bevat { id, role } zoals gezet bij login
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err?.message || err);
    return res.status(401).json({ ok: false, error: "Ongeldige of verlopen sessie" });
  }
}

module.exports = { verifyToken };
