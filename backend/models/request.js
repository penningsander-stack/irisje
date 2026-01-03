// backend/models/request.js
// v20260103-FIX-REQUEST-MODEL
// - herstelt syntaxis (geen placeholders)
// - ondersteunt multi-bedrijf: companyId (child) + parentRequestId + selectedCompanyIds (parent)

const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    // Aanvrager
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, default: "", trim: true },

    // Inhoud
    message: { type: String, default: "", trim: true },

    // Matching velden (wizard)
    category: { type: String, required: true, trim: true },
    specialty: { type: String, default: "", trim: true },
    communication: { type: String, default: "", trim: true },
    experience: { type: String, default: "", trim: true },
    approach: { type: String, default: "", trim: true },
    involvement: { type: String, default: "", trim: true },

    // Status / herkomst
    status: { type: String, default: "Nieuw", trim: true },
    source: { type: String, default: "public", trim: true },

    // Koppeling naar bedrijf (child requests)
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },

    // Multi-bedrijf parent/child
    isParent: { type: Boolean, default: false },
    parentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null },
    selectedCompanyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],

    // Extra
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Request || mongoose.model("Request", RequestSchema);
