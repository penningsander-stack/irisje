// backend/models/Company.js
const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: String,
  email: String,
  category: String,
  phone: String,
  address: String,
  website: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Company", CompanySchema);
