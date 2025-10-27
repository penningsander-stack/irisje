// backend/models/Request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
      default: "Nieuw",
    },
    // ✅ Altijd automatisch ingevulde datum van aanvraag
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // voegt ook createdAt en updatedAt toe
);

module.exports = mongoose.model("Request", requestSchema);
