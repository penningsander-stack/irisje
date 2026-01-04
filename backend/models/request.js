// backend/models/request.js
// v2026-01-06 FIX-OPTION-A-CATEGORY-NOT-REQUIRED

const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔧 FIX: niet meer verplicht
    category: {
      type: String,
      default: "",
      trim: true,
    },

    specialty: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      default: "Nieuw",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Request", RequestSchema);
