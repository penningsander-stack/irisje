// backend/models/request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  // Verplicht
  sector: {
    type: String,
    required: true,
  },

  // Contactgegevens aanvrager
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },

  // Optioneel / context
  specialty: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },

  // Gekoppeld bedrijf (bij multi-requests meerdere records)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", requestSchema);
