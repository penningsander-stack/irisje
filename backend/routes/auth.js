// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * 🧩 Middleware: controleert of er een geldige token in de cookies zit.
 * Als de token geldig is → req.user = decoded payload.
 * Anders → 401 fout.
 */
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ ok: false, error: "Geen token gevonden – niet ingelogd" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // bevat { id, email, ... }
    next();
  } catch (err) {
    console.error("❌ Ongeldige of verlopen token:", err.message);
    return res
      .status(401)
      .json({ ok: false, error: "Ongeldige of verlopen token" });
  }
}

module.exports = { verifyToken };
