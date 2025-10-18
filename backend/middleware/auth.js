// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * Middleware die controleert of een geldige JWT-token is meegegeven.
 * Verwacht in de Authorization-header: "Bearer <token>"
 * Zet bij succes req.user = { companyId: ... }
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Geen header aanwezig
    if (!authHeader) {
      return res.status(401).json({ error: "Geen token meegegeven" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Ongeldig tokenformaat" });
    }

    // Token ontcijferen
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token moet companyId bevatten
    if (!decoded || !decoded.companyId) {
      return res.status(401).json({ error: "Token bevat geen geldig bedrijf-ID" });
    }

    // Zet bedrijf-ID beschikbaar voor volgende routes
    req.user = { companyId: decoded.companyId };

    // Ga door naar volgende middleware of route
    next();
  } catch (err) {
    console.error("❌ Auth middleware fout:", err.message);
    return res.status(401).json({ error: "Ongeldige of verlopen token" });
  }
};
