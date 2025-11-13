// backend/models/claim.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * 🌸 Irisje.nl – Claimmodel
 * Bedrijven kunnen een claim indienen op hun profiel (bijv. verificatie).
 * Admin kan claim requests bekijken, verifiëren, afwijzen.
 */

const ClaimSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    contactName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 40,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    /**
     * status:
     * - pending   → claim is nieuw
     * - verified  → admin heeft verificatie goedgekeurd
     * - rejected  → claim is afgewezen
     */
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model("Claim", ClaimSchema);
