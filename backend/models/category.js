// backend/models/category.js
const mongoose = require("mongoose");

const specialtySchema = new mongoose.Schema(
  {
    value: { type: String, required: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    value: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    specialties: [specialtySchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
