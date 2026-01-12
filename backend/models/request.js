// backend/models/request.js
const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  sector: {
    type: String,
    required: true,
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

module.exports = mongoose.model("Request", RequestSchema);
