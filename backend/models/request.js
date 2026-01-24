// backend/models/request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    sector: { type: String, required: true },     // bijv. "Advocaat"
    category: { type: String },                    // alias/legacy
    specialty: { type: String, required: true },  // bijv. "Arbeidsrecht"
    city: { type: String, required: true },        // bijv. "Amsterdam"
    companies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
