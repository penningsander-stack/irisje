// backend/utils/systemUser.js
// v20260103-SYSTEM-USER-FINAL

const User = require("../models/user"); // ⚠️ lowercase is cruciaal

const SYSTEM_EMAIL = "system@irisje.nl";

async function getSystemUser() {
  let user = await User.findOne({ email: SYSTEM_EMAIL });

  if (!user) {
    user = await User.create({
      name: "Irisje System",
      email: SYSTEM_EMAIL,
      password: Math.random().toString(36).slice(-12),
      role: "admin",
    });
    console.log("[systemUser] System user aangemaakt:", SYSTEM_EMAIL);
  }

  return user;
}

module.exports = { getSystemUser };
