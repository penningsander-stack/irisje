// backend/models/review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true },
    email: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
    reported: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },

    // ✅ Nieuw: reviewbevestiging
    isConfirmed: { type: Boolean, default: false },
    confirmToken: { type: String, index: true, required: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
