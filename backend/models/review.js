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
// backend/models/review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    reported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
