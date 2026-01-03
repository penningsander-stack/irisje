// backend/utils/systemUser.js
// v20260103-SYSTEM-USER

const User = require("../models/User");

const SYSTEM_EMAIL = "system@irisje.nl";

async function getSystemUser() {
  let user = await User.findOne({ email: SYSTEM_EMAIL });

  if (!user) {
    user = await User.create({
      name: "Irisje System",
      email: SYSTEM_EMAIL,
      password: Math.random().toString(36).slice(-12), // nooit gebruikt
      role: "admin", // of "system" als je dat onderscheid gebruikt
      companyId: null,
    });

    console.log("[systemUser] System user aangemaakt:", SYSTEM_EMAIL);
  }

  return user;
}

module.exports = { getSystemUser };
