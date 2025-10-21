// backend/models/review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  message: { type: String },
  reported: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);
