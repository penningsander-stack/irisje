// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

// Inloggen
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Ongeldig e-mailadres" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    // Koppel bedrijf
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

    res.json({
      token,
      companyId: company ? company._id : null,
      message: "Succesvol ingelogd",
    });
  } catch (err) {
    console.error("❌ Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

module.exports = router;
