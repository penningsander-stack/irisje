// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.header("Authorization");
  if (!header) return res.status(401).json({ error: "Geen token meegegeven" });

  const token = header.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Geen token meegegeven" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "irisje_secret_key_2025");
    req.user = decoded; // bevat minstens: id, email (en optioneel companyId)
    next();
  } catch (err) {
    console.error("JWT verify fout:", err.message);
    return res.status(401).json({ error: "Ongeldige of verlopen token" });
  }
};
