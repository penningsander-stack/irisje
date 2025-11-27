// backend/models/claimrequest.js
const mongoose = require("mongoose");

const claimrequestschema = new mongoose.Schema(
  {
    companyid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",        // altijd lowercase zoals afgesproken
      required: true
    },

    contactname: {
      type: String,
      required: true,
      trim: true
    },

    contactemail: {
      type: String,
      required: true,
      trim: true
    },

    contactphone: {
      type: String,
      default: ""
    },

    kvknumber: {
      type: String,
      default: ""
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

    verificationcode: {
      type: String,
      default: null
    },

    verificationsentat: {
      type: Date,
      default: null
    },

    verifiedat: {
      type: Date,
      default: null
    },

    adminnotes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("claimrequest", claimrequestschema);
