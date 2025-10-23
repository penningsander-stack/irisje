// backend/models/Company.js
const mongoose = require("mongoose");

/**
 * Uitgebreid Company-model:
 * - name, owner: bestaand (vereist)
 * - extra velden voor publieke weergave (optioneel)
 */
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Publieke velden:
    slug: { type: String, unique: true, sparse: true, trim: true }, // bijv. "loodgieter-jan"
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },
    categories: [{ type: String, trim: true }], // ["Loodgieter","CV"]
    city: { type: String, trim: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },

    // Aggregaten
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    // Media
    images: [{ type: String, trim: true }],

    // Andere flags
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
