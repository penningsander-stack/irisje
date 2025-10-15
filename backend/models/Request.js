// backend/models/Request.js
const mongoose = require('mongoose');

const statusEnum = ['Nieuw', 'Geaccepteerd', 'Afgewezen', 'Opgevolgd'];

const requestSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    message: { type: String },
    category: { type: String, index: true },

    // Bedrijven die de aanvraag zouden moeten ontvangen (targets)
    targetCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],

    // Status per bedrijf
    statusByCompany: [
      {
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
        status: { type: String, enum: statusEnum, default: 'Nieuw' },
        updatedAt: { type: Date, default: Date.now }
      }
    ],

    // Metadata
    meta: {
      ip: String,
      userAgent: String,
      sourceUrl: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
module.exports.statusEnum = statusEnum;
