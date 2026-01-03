// backend/routes/publicRequests.js
// v20260103-FIX-GET-AND-SEND
// Publieke aanvragen + matching op category + specialty
// - POST /api/publicRequests            => maakt "parent" aanvraag + geeft matches terug
// - GET  /api/publicRequests/:id        => haalt parent aanvraag op + geeft matches terug
// - POST /api/publicRequests/:id/send   => maakt 1 request per gekozen bedrijf (max 5)

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const Request = require("../models/request");

function buildCompanyQuery({ category, specialty }) {
  const q = { active: true };
  if (category) q.category = category;

  // specialty match:
  // - als Company.specialties een array is: { specialties: specialty }
  // - als het een string is: werkt dit ook (equals)
  if (specialty) q.specialties = specialty;

  return q;
}

// POST /api/publicRequests
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      message,
      category,
      specialty,
      communication,
      experience,
      approach,
      involvement,
    } = req.body || {};

    if (!name || !email || !category) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mail en categorie zijn verplicht",
      });
    }

    // 1) Parent aanvraag opslaan (nog NIET aan bedrijven gekoppeld)
    const parent = await Request.create({
      name,
      email,
      message: message || "",
      category,
      specialty: specialty || "",
      communication: communication || "",
      experience: experience || "",
      approach: approach || "",
      involvement: involvement || "",
      status: "Nieuw",
      source: "public",
      isParent: true,
      selectedCompanyIds: [],
    });

    // 2) Matching companies
    const companyQuery = buildCompanyQuery({ category, specialty });

    const companies = await Company.find(companyQuery)
      .limit(50)
      .select("_id name city rating premium category specialties")
      .lean();

    return res.json({
      ok: true,
      requestId: parent._id,
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij public request (POST):", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij verwerken aanvraag",
    });
  }
});

// GET /api/publicRequests/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const parent = await Request.findById(id).lean();
    if (!parent) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });
    }

    const companyQuery = buildCompanyQuery({
      category: parent.category,
      specialty: parent.specialty,
    });

    const companies = await Company.find(companyQuery)
      .limit(50)
      .select("_id name city rating premium category specialties")
      .lean();

    return res.json({
      ok: true,
      request: parent,
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij public request (GET):", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvraag" });
  }
});

// POST /api/publicRequests/:id/send
router.post("/:id/send", async (req, res) => {
  try {
    const id = req.params.id;
    const { companyIds } = req.body || {};

    if (!Array.isArray(companyIds)) {
      return res.status(400).json({ ok: false, error: "companyIds moet een array zijn" });
    }
    const unique = [...new Set(companyIds.map(String))].slice(0, 5);

    if (unique.length < 1) {
      return res.status(400).json({ ok: false, error: "Selecteer minimaal 1 bedrijf" });
    }

    const parent = await Request.findById(id);
    if (!parent) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });
    }

    // extra check: bestaan bedrijven?
    const companies = await Company.find({ _id: { $in: unique }, active: true })
      .select("_id name")
      .lean();

    if (!companies.length) {
      return res.status(400).json({ ok: false, error: "Geen geldige bedrijven geselecteerd" });
    }

    // 1 request per bedrijf (zodat bedrijven in dashboard alleen hun eigen requests zien)
    const docs = companies.map((c) => ({
      name: parent.name,
      email: parent.email,
      city: parent.city || "",
      message: parent.message || "",
      category: parent.category,
      specialty: parent.specialty || "",
      communication: parent.communication || "",
      experience: parent.experience || "",
      approach: parent.approach || "",
      involvement: parent.involvement || "",
      status: "Nieuw",
      source: "public",
      companyId: c._id,
      parentRequestId: parent._id,
      isParent: false,
    }));

    const created = await Request.insertMany(docs, { ordered: false });

    parent.selectedCompanyIds = companies.map((c) => c._id);
    parent.status = "Verstuurd";
    parent.isParent = true;
    parent.sentAt = new Date();
    await parent.save();

    return res.json({
      ok: true,
      createdCount: created.length,
      companies: companies,
    });
  } catch (err) {
    console.error("❌ Fout bij public request (SEND):", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij versturen aanvraag" });
  }
});

module.exports = router;
