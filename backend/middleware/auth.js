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

    const companyId = decoded.companyId || decoded.id;
    if (!companyId) {
      return res.status(401).json({ error: "Ongeldig token" });
    }

    const company = await Company.findById(companyId).select("_id email name");
    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden" });
    }

    // Beschikbaar voor routes
    req.user = {
      id: company._id,
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
