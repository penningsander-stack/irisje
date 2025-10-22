const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

router.post("/demo-user", async (_req, res) => {
  try {
    const email = "demo@irisje.nl";
    const exists = await User.findOne({ email });
    if (exists) return res.json({ ok: true, message: "Demo user bestaat al", userId: exists._id });
    const hash = await bcrypt.hash("demo1234", 10);
    const u = await User.create({ email, password: hash, role: "company", name: "Demo Bedrijf" });
    res.json({ ok: true, userId: u._id });
  } catch (e) {
    console.error("seed demo-user error:", e);
    res.status(500).json({ ok: false, error: "seed failed" });
  }
});

module.exports = router;
