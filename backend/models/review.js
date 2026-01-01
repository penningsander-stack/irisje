// backend/models/review.js
// v20260101-REVIEW-CONTRACT-OPTION-B
//
// Canoniek review model voor Irisje.nl
// Optie B: status + confirmToken
//
// Leidende velden:
// - companyId
// - comment
// - rating
// - reviewerName / reviewerEmail
// - status (pending | approved | rejected)
// - confirmToken
//
// Legacy compat:
// - isConfirmed (wordt niet meer gebruikt, maar blijft bestaan indien aanwezig)

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Koppeling
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // Inhoud
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
      maxlength: 2000,
    },

    // Auteur
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    reviewerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },

    // Workflow / moderatie
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Bevestiging per e-mail
    confirmToken: {
      type: String,
      default: null,
      index: true,
    },

    // --- Legacy (niet leidend, niet verwijderen) ---
    // Wordt genegeerd in nieuwe flow, maar blijft leesbaar
    isConfirmed: {
      type: Boolean,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Extra index voor performance (optioneel maar veilig)
reviewSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model("Review", reviewSchema);
