// backend/models/Company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    categories: [{ type: String }],
    city: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" }, // ← toegevoegd, maar NIET uniek
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

module.exports = mongoose.model("Company", companySchema);
