const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user"); // ✔️ gecorrigeerd: bestond niet als ../models/ser
const router = express.Router();

router.post("/reset-demo", async (_req, res) => {
  try {
    const email = "demo@irisje.nl";
    const password = "demo1234";
    const hash = await bcrypt.hash(password, 10);

    let u = await User.findOne({ email });
    if (!u) {
      u = await User.create({
        email,
        password: hash,
        role: "company",
        name: "Demo Bedrijf",
      });
    } else {
      u.password = hash;
      if (!u.name) u.name = "Demo Bedrijf";
      await u.save();
    }

    res.json({ ok: true, message: "Wachtwoord opnieuw ingesteld", userId: u._id });
  } catch (e) {
    console.error("fixDemo error:", e);
    res.status(500).json({ ok: false, error: "fixDemo failed" });
  }
});

module.exports = router;
