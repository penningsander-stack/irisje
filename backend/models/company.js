// backend/models/company.js
// v20260108-COMPANY-NO-EMAIL-ACTIVE
//
// Wijzigingen:
// - email veld VERWIJDERD (Company heeft geen eigen email)
// - active veld TOEGEVOEGD
// - overige structuur ongewijzigd
// - bestaande indexen behouden (geen email-index meer)

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

    // Matching / intake
    issueTypes: [{ type: String, lowercase: true, trim: true }],
    canHandleUrgent: { type: Boolean, default: false },
    budgetRanges: [{ type: String, lowercase: true, trim: true }],

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
    website: { type: String, default: "" },

    // Status & reviews
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },

    // Actief/vindbaar
    active: { type: Boolean, default: true },

    // Koppeling met User
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexen (veilig)
companySchema.index({ categories: 1 });
companySchema.index({ specialties: 1 });
companySchema.index({ regions: 1 });

module.exports = mongoose.model("Company", companySchema);
