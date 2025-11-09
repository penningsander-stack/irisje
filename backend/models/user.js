const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, trim: true },

    email: { type: String, required: true, unique: true, trim: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "company"],
      default: "company",
    },

    lastLogin: { type: Date },

    // 🔑 Voor wachtwoordherstel (tijdelijke velden)
    resetToken: { type: String, default: null },
    resetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
