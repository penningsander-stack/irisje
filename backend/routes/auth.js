// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-mailadres en wachtwoord zijn verplicht" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Onbekend e-mailadres" });
    if (!user.password)
      return res.status(500).json({ error: "Gebruiker bevat geen wachtwoordveld in database" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    const company = await Company.findOne({ user: user._id });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        companyId: company ? company._id : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      companyId: company ? company._id : null,
      message: "Succesvol ingelogd",
    });
  } catch (err) {
    console.error("❌ Login-fout:", err);
    return res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

module.exports = router;
