// backend/models/company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    /* 🔹 Basisgegevens */
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },

    /* 🔹 Categorie en specialisaties */
    categories: [{ type: String, trim: true }],
    specialties: [{ type: String, trim: true }], // hoofdgroepen
    specializations: [{ type: String, trim: true }], // detailniveaus binnen specialisme

    /* 🔹 Bereik & regio’s */
    regions: {
      type: [String],
      default: [],
      set: (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map(s => s.trim()) : []),
    },
    worksNationwide: { type: Boolean, default: false },

    /* 🔹 Erkenningen en certificeringen */
    certifications: {
      type: [String],
      default: [],
      set: (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map(s => s.trim()) : []),
    },
    recognitions: {
      type: [String],
      default: [],
      set: (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map(s => s.trim()) : []),
    },
    memberships: {
      type: [String],
      default: [],
      set: (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map(s => s.trim()) : []),
    },

    /* 🔹 Communicatie & talen */
    languages: {
      type: [String],
      default: [],
      set: (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map(s => s.trim()) : []),
    },
    availability: { type: String, trim: true, default: "" },

    /* 🔹 Contactinformatie */
    city: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },

    /* 🔹 Reviews en verificatie */
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },

    /* 🔹 Koppeling naar eigenaar */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/* ⚡ Indexen voor snellere zoekopdrachten */
companySchema.index({ categories: 1, specialties: 1, regions: 1 });
companySchema.index({ certifications: 1, recognitions: 1, memberships: 1 });

module.exports = mongoose.model("Company", companySchema);
