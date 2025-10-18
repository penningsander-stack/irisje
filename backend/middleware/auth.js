// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Geen token meegegeven" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // bevat id, email en companyId
    next();
  } catch (err) {
    console.error("❌ JWT-fout:", err);
    res.status(401).json({ error: "Ongeldige token" });
  }
};
