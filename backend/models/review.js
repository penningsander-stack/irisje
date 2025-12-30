// backend/models/review.js
// v20251230-REVIEW-STATUS
//
// Wijzigingen:
// - status toegevoegd: approved | pending | rejected
// - default = pending (voor nieuwe reviews)
// - backward compatible: oude reviews zonder status => approved
// - GEEN breaking changes

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    reviewerName: {
      type: String,
      trim: true,
    },

    reviewerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // ✅ NIEUW: review status
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// ✅ Backward compatibility: oude docs zonder status => approved
reviewSchema.pre("save", function (next) {
  if (!this.status) this.status = "approved";
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
