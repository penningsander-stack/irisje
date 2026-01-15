// backend/models/request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  sector: {
    type: String,
    required: true,
  },
  specialty: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", requestSchema);
