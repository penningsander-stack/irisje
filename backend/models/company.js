// backend/models/Company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    categories: [{ type: String }],

    // ✅ Nieuw veld: specialismen binnen de categorie
    specialties: [{ type: String, trim: true }],

    city: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" }, // niet uniek, bewust toegestaan
    website: { type: String, default: "" },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index voor snellere zoekopdrachten op categorie + specialisme
companySchema.index({ categories: 1, specialties: 1 });

module.exports = mongoose.model("Company", companySchema);
