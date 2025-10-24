// backend/routes/seed.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.get("/create-admin", async (req, res) => {
  try {
    const existing = await User.findOne({ email: "info@irisje.nl" });
    if (existing) {
      return res.json({ message: "Admin bestaat al", user: existing });
    }

    const hashedPassword = await bcrypt.hash("Admin1234!", 10);

    const adminUser = new User({
      name: "Irisje Admin",
      email: "info@irisje.nl",
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();

    res.json({ message: "✅ Admin aangemaakt", user: adminUser });
  } catch (err) {
    console.error("❌ Fout bij seed:", err);
    res.status(500).json({ message: "Fout bij aanmaken admin" });
  }
});

module.exports = router;
