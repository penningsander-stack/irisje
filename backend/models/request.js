// backend/models/request.js

const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, trim: true },

    category: { type: String, default: "" },
    categories: { type: [String], default: [] },
    specialty: { type: String, default: "" },
    specialties: { type: [String], default: [] },

    // startbedrijf
    companySlug: { type: String, default: null, trim: true, index: true },

    selectedCompanies: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Company",
      default: [],
    },

    status: {
      type: String,
      enum: ["Concept", "Verstuurd"],
      default: "Concept",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
