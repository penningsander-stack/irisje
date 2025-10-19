// backend/models/Request.js
const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: String,
  email: String,
  message: String,
  status: { type: String, default: "Nieuw" },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Request", RequestSchema);
