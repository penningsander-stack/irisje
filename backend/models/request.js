// backend/models/request.js

const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  sector: String,
  specialty: String,
  city: String,

  // ✅ NIEUW
  selectedCompanies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
  ],

  status: {
    type: String,
    default: "open",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", RequestSchema);
