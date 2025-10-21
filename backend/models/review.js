// backend/models/review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  companyId: { type: String, required: true },
  name: String,
  rating: Number,
  message: String,
  date: Date,
  reported: { type: Boolean, default: false } // 👈 nieuw veld
});

module.exports = mongoose.model("Review", reviewSchema);
