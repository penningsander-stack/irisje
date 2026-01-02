// backend/models/request.js
// v20260102-REQUEST-CONTEXT-APPEND
//
// Request model – append-only uitbreiding
// Nieuw veld: context (werknemer / werkgever)
// Bestaande velden blijven onaangetast

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

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Bestond al
    category: {
      type: String,
      default: "",
      trim: true,
    },

    // Bestond al
    specialty: {
      type: String,
      default: "",
      trim: true,
    },

    // NIEUW – append-only
    // Wordt gebruikt voor bijv. werknemer / werkgever
    context: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    postcode: {
      type: String,
      default: "",
      trim: true,
    },

    street: {
      type: String,
      default: "",
      trim: true,
    },

    houseNumber: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Request", RequestSchema);
