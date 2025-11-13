// backend/models/claimrequest.js
const mongoose = require("mongoose");

const claimrequestschema = new mongoose.Schema(
  {
    companyid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true
    },

    contactname: {
      type: String,
      required: true
    },

    contactemail: {
      type: String,
      required: true
    },

    contactphone: {
      type: String
    },

    kvknumber: {
      type: String
    },

    methodrequested: {
      type: String,
      enum: ["email", "sms", "kvk", "doc"],
      default: "email"
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "cancelled"],
      default: "pending"
    },

    verificationcode: String,
    verificationsentat: Date,
    verifiedat: Date,

    adminnotes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("claimrequest", claimrequestschema);
