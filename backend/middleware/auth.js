const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ ok: false, error: "Geen token – niet ingelogd" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    console.error("❌ Ongeldige/verlopen token:", err.message);
    return res.status(401).json({ ok: false, error: "Ongeldige of verlopen sessie" });
  }
}

module.exports = { verifyToken };
