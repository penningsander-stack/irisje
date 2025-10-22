// backend/routes/seed.js
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

// /api/seed/demo-user  → maakt demo@irisje.nl / demo1234 als hij niet bestaat
router.post("/demo-user", async (req, res) => {
  try {
    const email = "demo@irisje.nl";
    let user = await User.findOne({ email });
    if (user) {
      return res.json({ ok: true, message: "Demo user bestaat al", userId: user._id });
    }
    const hashed = await bcrypt.hash("demo1234", 10);
    user = await User.create({
      name: "Demo Bedrijf",
      email,
      password: hashed,
      role: "company"
    });
    return res.json({ ok: true, message: "Demo user aangemaakt", userId: user._id });
  } catch (e) {
    console.error("Seed error:", e);
    return res.status(500).json({ error: "Kon demo user niet maken" });
  }
});

module.exports = router;
