const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

router.post("/reset-demo", async (_req, res) => {
  try {
    const email = "demo@irisje.nl";
    const hashed = await bcrypt.hash("demo1234", 10);
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashed },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ ok: false, message: "Gebruiker niet gevonden" });
    }
    return res.json({ ok: true, message: "Wachtwoord opnieuw ingesteld", userId: user._id });
  } catch (e) {
    console.error("reset-demo error:", e);
    return res.status(500).json({ ok: false, message: "Kon wachtwoord niet aanpassen" });
  }
});

module.exports = router;
