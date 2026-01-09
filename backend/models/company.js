// backend/models/company.js
// v20260108-ADD-WORKFORMS-TARGETGROUPS

const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    // Basis
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    city: {
      type: String,
      default: "",
    },

    // Relaties
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Matching / profiel
    categories: {
      type: [String],
      default: [],
    },
    regions: {
      type: [String],
      default: [],
    },
    specialties: {
      type: [String],
      default: [],
    },

    // ✅ NIEUW (dashboard)
    workforms: {
      type: [String],
      default: [],
    },
    targetGroups: {
      type: [String],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    memberships: {
      type: [String],
      default: [],
    },

    availability: {
      type: String,
      default: "",
    },

    worksNationwide: {
      type: Boolean,
      default: false,
    },

    // Reviews / status
    avgRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", CompanySchema);
