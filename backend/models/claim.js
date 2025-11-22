// backend/models/claim.js
const mongoose = require("mongoose");
const { schema } = mongoose;

const claimSchema = new mongoose.Schema(
  {
    companyid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },

    contactname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    contactemail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    contactphone: {
      type: String,
      trim: true,
      maxlength: 40,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("claim", claimSchema);
