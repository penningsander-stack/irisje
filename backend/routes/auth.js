// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const router = express.Router();

// ✅ Registratie – nieuw bedrijf aanmaken
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, category, phone, address, website } = req.body;

    // Controleren of e-mail al bestaat
    const existing = await Company.findOne({ email });
    if (existing) return res.status(400).json({ error: "E-mail bestaat al" });

    // Wachtwoord hashen
    const hashed = await bcrypt.hash(password, 10);

    // Nieuw bedrijf opslaan
    const newCompany = new Company({
      name,
      email,
      password: hashed,
      category,
      phone,
      address,
      website
    });

    await newCompany.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fout bij registreren:", err);
    res.status(500).json({ error: "Serverfout bij registratie" });
  }
});

// ✅ Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

    const match = await bcrypt.compare(password, company.password);
    if (!match) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.json({
      token,
      company: {
        name: company.name,
        email: company.email,
        category: company.category,
      },
    });
  } catch (err) {
    console.error("❌ Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// ✅ Tokenverificatie – gebruikt door secure.js om sessie te behouden
router.get("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Geen token" });
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const company = await Company.findById(decoded.companyId).select("name email category");
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json({ company });
  } catch {
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
});

module.exports = router;
