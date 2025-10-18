// backend/models/Request.js
const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
    default: "Nieuw",
  },
  date: { type: Date, default: Date.now },
});

// Voorkom OverwriteModelError
module.exports =
  mongoose.models.Request || mongoose.model("Request", RequestSchema);
