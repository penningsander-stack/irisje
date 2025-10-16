// backend/models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    // Ondersteun zowel 'message' als oudere 'customerMessage'
    message: { type: String },
    customerMessage: { type: String },

    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    status: {
      type: String,
      enum: ['Nieuw', 'Geaccepteerd', 'Afgewezen', 'Opgevolgd'],
      default: 'Nieuw',
    },
  },
  { timestamps: true }
);

// Zorg dat toJSON altijd één 'message' veld exposeert
requestSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.message = ret.message || ret.customerMessage || '';
    delete ret.customerMessage;
    return ret;
  },
});

module.exports = mongoose.model('Request', requestSchema);
