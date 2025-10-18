// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Geen token meegegeven" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const company = await Company.findById(decoded.companyId);
    if (!company) {
      return res.status(401).json({ error: "Bedrijf niet gevonden" });
    }

    // Zet data voor gebruik in routes
    req.user = {
      id: decoded.id,
      companyId: company._id,
      email: company.email,
      name: company.name,
    };

    next();
  } catch (err) {
    console.error("❌ Fout in auth middleware:", err.message);
    return res.status(401).json({ error: "Ongeldige of verlopen token" });
  }
};
