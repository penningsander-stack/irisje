// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const router = express.Router();

// Registreren
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, category, phone, address, website } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Naam, e-mail en wachtwoord zijn verplicht" });
    }

    const existing = await Company.findOne({ email });
    if (existing) return res.status(400).json({ error: "E-mail bestaat al" });

    const hashed = await bcrypt.hash(password, 10);

    const newCompany = new Company({
      name,
      email,
      password: hashed,
      category,
      phone,
      address,
      website,
    });

    await newCompany.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fout bij registreren:", err);
    res.status(500).json({ error: "Serverfout bij registratie" });
  }
});

// Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mail en wachtwoord verplicht" });

    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

    const match = await bcrypt.compare(password, company.password || "");
    if (!match) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    const token = jwt.sign(
      { companyId: company._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      company: {
        name: company.name,
        email: company.email,
        category: company.category || "",
      },
    });
  } catch (err) {
    console.error("❌ Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// Token verifiëren (gebruikt door frontend/js/secure.js)
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Geen token" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const company = await Company.findById(decoded.companyId).select("name email category");
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

    res.json({ company });
  } catch (err) {
    console.error("❌ Verify-fout:", err.message);
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
});

module.exports = router;
