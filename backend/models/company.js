// backend/models/company.js

const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },

    categories: [{ type: String, trim: true }],
    specialties: [{ type: String, trim: true }],
    specializations: [{ type: String, trim: true }],

// Voeg deze velden toe aan het Company schema
issueTypes: [{ type: String, lowercase: true, trim: true }], // bijv. ["ontslag","loon"]
canHandleUrgent: { type: Boolean, default: false },
budgetRanges: [{ type: String, lowercase: true, trim: true }], // bijv. ["tot-500","500-1500"]


    regions: {
      type: [String],
      default: [],
      set: (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
          ? v.split(",").map((s) => s.trim())
          : [],
    },
    worksNationwide: { type: Boolean, default: false },

    certifications: {
      type: [String],
      default: [],
      set: (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
          ? v.split(",").map((s) => s.trim())
          : [],
    },

    recognitions: {
      type: [String],
      default: [],
      set: (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
          ? v.split(",").map((s) => s.trim())
          : [],
    },

    memberships: {
      type: [String],
      default: [],
      set: (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
          ? v.split(",").map((s) => s.trim())
          : [],
    },

    languages: {
      type: [String],
      default: [],
      set: (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
          ? v.split(",").map((s) => s.trim())
          : [],
    },

    availability: { type: String, default: "" },

    city: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
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

/*
 ❗ MongoDB kan geen parallelle arrays indexeren
 ❗ Daarom GEEN samengestelde index meer
*/

// Losse indexen (veilig)
companySchema.index({ categories: 1 });
companySchema.index({ specialties: 1 });
companySchema.index({ regions: 1 });

module.exports = mongoose.model("Company", companySchema);
