// backend/models/ClaimRequest.js
const mongoose = require('mongoose');

const ClaimRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    kvkNumber: String,
    methodRequested: {
      type: String,
      enum: ['email', 'sms', 'kvk', 'doc'],
      default: 'email'
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'cancelled'],
      default: 'pending'
    },
    verificationCode: String, // wordt later gehasht opgeslagen
    verificationSentAt: Date,
    verifiedAt: Date,
    adminNotes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClaimRequest', ClaimRequestSchema);
