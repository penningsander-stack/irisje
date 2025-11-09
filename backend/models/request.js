// backend/models/Request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    // 👇 niet meer verplicht, zodat openbare aanvragen werken
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
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
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
