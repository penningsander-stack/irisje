// backend/models/Request.js
// ✅ MongoDB-model voor aanvragen (bedrijven ontvangen klantaanvragen)

const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Naam van klant is verplicht"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "E-mailadres van klant is verplicht"],
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    customerMessage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
      default: "Nieuw",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true, // maakt automatisch createdAt & updatedAt
  }
);

module.exports = mongoose.model("Request", RequestSchema);
