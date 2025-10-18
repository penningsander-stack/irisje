// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const router = express.Router();

// Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mail en wachtwoord verplicht" });

    const company = await Company.findOne({ email });
    if (!company) return res.status(400).json({ error: "Ongeldig e-mailadres" });

    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return res.status(400).json({ error: "Ongeldig wachtwoord" });

    // Token 7 dagen geldig
    const token = jwt.sign(
      { id: company._id, companyId: company._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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
    console.error("Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

module.exports = router;
