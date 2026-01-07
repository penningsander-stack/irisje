// backend/seed/fix-company-owners.js
require("dotenv").config();
const mongoose = require("mongoose");
const Company = require("../models/company");
const User = require("../models/user");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne().lean();
  if (!user) {
    console.error("Geen user gevonden");
    process.exit(1);
  }

  const result = await Company.updateMany(
    {},
    { $set: { owner: user._id } }
  );

  console.log("Bedrijven bijgewerkt:", result.modifiedCount);

  await mongoose.disconnect();
})();
