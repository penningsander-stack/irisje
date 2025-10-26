// backend/models/Request.js
const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false, // 🔧 niet verplicht bij openbare aanvraag
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
});

module.exports = mongoose.model("Request", RequestSchema);
