// backend/models/request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    // Niet verplicht: sommige aanvragen worden pas later gekoppeld
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },

    // Basisgegevens van de aanvrager
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, trim: true },
    message: { type: String, required: true, trim: true },

    // Nieuwe velden (voor toekomstige uitbreidingen)
    category: { type: String, default: "" },       // bijv. “Advocaat”
    specialty: { type: String, default: "" },      // bijv. “Arbeidsrecht”
    communication: { type: String, default: "" },  // bijv. “Telefonisch / e-mail”
    experience: { type: String, default: "" },     // bijv. “Laat me adviseren”
    approach: { type: String, default: "" },       // bijv. “Weet nog niet”
    involvement: { type: String, default: "" },    // bijv. “Actief betrokken blijven”

    // Statusbeheer
    status: {
      type: String,
      enum: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
      default: "Nieuw",
    },

    // Datum automatisch
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexen voor snellere zoekopdrachten
requestSchema.index({ company: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Request", requestSchema);
