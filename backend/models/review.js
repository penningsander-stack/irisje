// backend/models/review.js
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: String,
  rating: Number,
  message: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", ReviewSchema);
