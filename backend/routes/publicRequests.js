// backend/routes/publicRequests.js
// v20260103-PUBLICREQUESTS-GET-FIX
//
// Publieke request endpoints (wizard / select-companies):
// - POST /api/publicRequests              -> maak aanvraag (bestaat al)
// - GET  /api/publicRequests/:id          -> haal aanvraag op + bijpassende bedrijven
//
// Fix: select-companies.js verwacht GET /api/publicRequests/:id maar die route ontbrak -> 404.

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

// Helper: veilige case-insensitive regex (exact match, maar tolerant voor hoofdletters)
function exactRegex(input) {
  const s = String(input || "").trim();
  if (!s) return null;
  const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

// ✅ 1) Aanvraag aanmaken (bestaand)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message, category, specialty, context, city, postcode, street, houseNumber } = req.body || {};

    // Minimale validatie (houdt rekening met hoe je wizard werkt)
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "name, email en message zijn verplicht" });
    }

    const request = await Request.create({
      name,
      email,
      phone: phone || "",
      message,
      category: category || "",
      specialty: specialty || "",
      context: context || "",
      city: city || "",
      postcode: postcode || "",
      street: street || "",
      houseNumber: houseNumber || "",
      status: "Nieuw",
    });

    return res.json({ ok: true, requestId: request._id });
  } catch (err) {
    console.error("[publicRequests] POST / error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

// ✅ 2) Aanvraag ophalen + matching bedrijven (NIEUW) -> voorkomt 404 in select-companies.js
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: "Ongeldig requestId" });
    }

    const request = await Request.findById(id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });
    }

    // Bouw query op basis van request (category + specialty + (optioneel) city)
    const and = [];

    const catRx = exactRegex(request.category);
    if (catRx) {
      and.push({ categories: catRx });
    }

    const specRx = exactRegex(request.specialty);
    if (specRx) {
      and.push({
        $or: [{ specialties: specRx }, { specializations: specRx }],
      });
    }

    const cityRx = exactRegex(request.city);
    if (cityRx) {
      and.push({ city: cityRx });
    }

    const query = and.length ? { $and: and } : {};

    // Let op: we leveren alleen fields die front-end meestal nodig heeft.
    // (Je kunt dit later uitbreiden.)
    const companies = await Company.find(query)
      .select("name city categories specialties specializations verified rating reviewCount logoUrl slug")
      .sort({ verified: -1, rating: -1 })
      .limit(50)
      .lean();

    return res.json({ ok: true, request, companies });
  } catch (err) {
    console.error("[publicRequests] GET /:id error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

module.exports = router;
