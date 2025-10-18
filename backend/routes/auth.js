// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail en wachtwoord zijn verplicht." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Onbekende gebruiker." });
    }

    // Kijk wat er in het document staat (alleen tijdens debug)
    console.log("Gebruiker gevonden:", {
      email: user.email,
      heeftPassword: !!user.password,
      heeftPasswordHash: !!user.passwordHash
    });

    // Test beide mogelijke velden
    const hash = user.passwordHash || user.password;
    if (!hash) {
      return res.status(400).json({ error: "Gebruiker heeft geen wachtwoordveld." });
    }

    const geldig = await bcrypt.compare(password.trim(), hash.trim());
    if (!geldig) {
      return res.status(400).json({ error: "Ongeldig wachtwoord." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "irisje_secret_key_2025",
      { expiresIn: "2h" }
    );

    const company = await Company.findOne({ email });

    res.json({
      message: "Login succesvol",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      company
    });
  } catch (err) {
    console.error("Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

module.exports = router;
