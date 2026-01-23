// backend/models/request.js
const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    sector: {
      type: String,
      required: true
    },
    category: {
      type: String
    },
    specialty: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },

    // ✅ A16.3c: definitieve koppeling verzonden bedrijven
    sentCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", RequestSchema);
