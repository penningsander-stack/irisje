// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Geen autorisatie-header meegegeven" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token bevat companyId
    if (!decoded.companyId)
      return res.status(401).json({ error: "Ongeldig token: geen bedrijf-ID" });

    req.user = { companyId: decoded.companyId };
    next();
  } catch (err) {
    console.error("❌ Auth middleware fout:", err);
    res.status(401).json({ error: "Ongeldige of verlopen token" });
  }
};
