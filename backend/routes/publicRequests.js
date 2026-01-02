// backend/routes/publicRequests.js
// v20260102-PUBLIC-REQUESTS-WIZARD
//
// Ontvangt aanvragen vanuit de nieuwe Trustoo-achtige wizard
// - category / specialty / context leidend
// - city/postcode alleen verplicht voor niet-juridische categorieën
// - backward compatible met oude flows

const express = require("express");
const router = express.Router();
const multer = require("multer");

const Request = require("../models/request");

const upload = multer({ limits: { files: 3 } });

router.post("/", upload.array("photos", 3), async (req, res) => {
  try {
    const {
      category,
      specialty,
      context,
      message,
      description, // legacy
      name,
      email,
      phone,
      city,
      postcode,
      street,
      houseNumber,
    } = req.body || {};

    // Basisvalidatie (nieuw, leidend)
    if (!category) {
      return res.status(400).json({ ok: false, message: "Categorie ontbreekt." });
    }

    if (!specialty) {
      return res.status(400).json({ ok: false, message: "Specialisme ontbreekt." });
    }

    const finalMessage = message || description;
    if (!finalMessage) {
      return res.status(400).json({ ok: false, message: "Toelichting ontbreekt." });
    }

    if (!name || !email) {
      return res.status(400).json({ ok: false, message: "Naam en e-mail zijn verplicht." });
    }



// GET /api/publicRequests/:id
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });
    }

    return res.json({ ok: true, request });
  } catch (err) {
    console.error("[publicRequests] GET error:", err);
    return res.status(500).json({ ok: false, message: "Serverfout." });
  }
});







    // Alleen locatie afdwingen bij niet-juridische categorieën
    const isLegal = category === "advocaat";

    if (!isLegal) {
      if (!city || !postcode) {
        return res.status(400).json({
          ok: false,
          message: "Plaats en postcode zijn verplicht.",
        });
      }
    }

    const request = new Request({
      category,
      specialty,
      context: context || "",
      message: finalMessage,
      name,
      email,
      phone: phone || "",
      city: city || "",
      postcode: postcode || "",
      street: street || "",
      houseNumber: houseNumber || "",
      status: "nieuw",
    });

    await request.save();

    return res.json({
      ok: true,
      requestId: request._id,
    });
  } catch (err) {
    console.error("[publicRequests] POST error:", err);
    return res.status(500).json({
      ok: false,
      message: "Interne fout bij opslaan aanvraag.",
    });
  }
});

module.exports = router;
