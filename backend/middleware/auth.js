// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Geen token meegegeven" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const company = await Company.findById(decoded.companyId).select("_id email name");
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

    req.user = {
      companyId: company._id,
      email: company.email,
      name: company.name,
    };

    next();
  } catch (err) {
    console.error("❌ Auth-middleware fout:", err.message || err);
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
};
