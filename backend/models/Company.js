// backend/models/Company.js
const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  category: { type: String },
  phone: { type: String },
  address: { type: String },
  website: { type: String },
  dateCreated: { type: Date, default: Date.now },
  blocked: { type: Boolean, default: false }
});

module.exports = mongoose.models.Company || mongoose.model("Company", CompanySchema);
