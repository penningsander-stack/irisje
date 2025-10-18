// backend/models/review.js
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  reported: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
