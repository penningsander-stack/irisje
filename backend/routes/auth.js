// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

// tijdelijke demo login zonder database
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "demo@irisje.nl" && password === "demo1234") {
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || "geheim",
      { expiresIn: "12h" }
    );

    return res.json({
      message: "Succesvol ingelogd (demo)",
      token,
      user: { email: "demo@irisje.nl", name: "Demo Bedrijf" },
    });
  }

  return res.status(401).json({ error: "Ongeldig e-mailadres of wachtwoord" });
});

module.exports = router;
