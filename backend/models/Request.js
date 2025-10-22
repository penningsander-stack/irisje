// backend/models/Request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
      default: "Nieuw",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
