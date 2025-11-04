// backend/models/ClaimRequest.js
const mongoose = require('mongoose');

const ClaimRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    contactName: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    kvkNumber: {
      type: String,
      default: ''
    },
    methodRequested: {
      // hoe wil hij verifiëren: email / sms / kvk / doc
      type: String,
      enum: ['email', 'sms', 'kvk', 'doc'],
      default: 'email'
    },
    status: {
      // verloop van de claim
      type: String,
      enum: ['pending', 'verified', 'rejected', 'cancelled'],
      default: 'pending'
    },
    verificationCode: {
      // hier komt de gehashte code in (niet de leesbare 6-cijfer code)
      type: String,
      default: ''
    },
    verificationSentAt: {
      type: Date
    },
    verifiedAt: {
      type: Date
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true // maakt createdAt en updatedAt aan
  }
);

module.exports = mongoose.model('ClaimRequest', ClaimRequestSchema);
