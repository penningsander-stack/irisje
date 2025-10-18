// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * Controleert of een geldige JWT-token aanwezig is.
 * Zet req.user = { companyId: ... } als alles klopt.
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Geen token meegegeven" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.companyId) {
      return res.status(401).json({ error: "Ongeldige token" });
    }

    req.user = { companyId: decoded.companyId };
    next();
  } catch (err) {
    console.error("❌ Auth middleware fout:", err.message);
    res.status(401).json({ error: "Ongeldige of verlopen token" });
  }
};
