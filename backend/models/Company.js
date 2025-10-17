// backend/models/Company.js
const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  category: String,
  phone: String,
  address: String,
  website: String,
  createdAt: { type: Date, default: Date.now },
});

// Hergebruik bestaand model als het al bestaat (voorkomt OverwriteModelError)
module.exports = mongoose.models.Company || mongoose.model("Company", CompanySchema);
