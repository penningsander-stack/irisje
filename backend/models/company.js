// backend/models/company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    city: { type: String, required: true },
    category: { type: String },          // legacy enkelvoud
    categories: [{ type: String }],       // meervoud
    specialties: [{ type: String }]       // specialismen
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
