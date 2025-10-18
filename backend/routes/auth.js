// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Vul e-mail en wachtwoord in." });

    const company = await Company.findOne({ email });
    if (!company) return res.status(401).json({ error: "Onbekend e-mailadres." });

    const match = await bcrypt.compare(password, company.password);
    if (!match) return res.status(401).json({ error: "Ongeldig wachtwoord." });

    const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token,
      company: {
        id: company._id,
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

router.get("/verify", (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.json({ valid: false });

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, companyId: decoded.companyId });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
