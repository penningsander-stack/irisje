// backend/models/company.js
// v20260109-CLEAN-SCHEMA

const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    city: { type: String, default: "" },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    categories: { type: [String], default: [] },
    regions: { type: [String], default: [] },
    specialties: { type: [String], default: [] },

    workforms: { type: [String], default: [] },
    targetGroups: { type: [String], default: [] },

    certifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    memberships: { type: [String], default: [] },

    availability: { type: String, default: "" },
    worksNationwide: { type: Boolean, default: false },

    introduction: { type: String, default: "" },
    reasons: { type: [String], default: [] },

    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);
