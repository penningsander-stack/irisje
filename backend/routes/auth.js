// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const router = express.Router();

/**
 * POST /api/auth/login
 * Inloggen met e-mail en wachtwoord
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vul e-mail en wachtwoord in." });
    }

    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(401).json({ error: "Onbekend e-mailadres." });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Ongeldig wachtwoord." });
    }

    // JWT-token aanmaken
    const token = jwt.sign(
      { companyId: company._id },
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
    console.error("❌ Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen." });
  }
});

/**
 * GET /api/auth/verify
 * Controleer of token geldig is
 */
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ valid: false });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.companyId) return res.json({ valid: false });

    res.json({ valid: true, companyId: decoded.companyId });
  } catch (err) {
    res.json({ valid: false });
  }
});

module.exports = router;
