// backend/models/request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    // matching-input (legacy + huidig)
    category: { type: String, default: "" },
    specialty: { type: String, default: "" },
    categories: [{ type: String }],
    specialties: [{ type: String }],

    // B2: selectie
    selectedCompanies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Company" }
    ],

    status: { type: String, default: "Nieuw" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
