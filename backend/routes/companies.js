// backend/routes/companies.js
const express = require("express");
const router = express.Router();

const Company = require("../models/Company");
const auth = require("../middleware/auth");

/* ============================================================
   Toegestane waarden
============================================================ */
const allowed_specialties = [
  "Arbeidsrecht",
  "Strafrecht",
  "Familierecht",
  "Huurrecht",
  "Ondernemingsrecht",
  "Bestuursrecht",
  "Letselschade",
  "Contractenrecht",
  "Vastgoedrecht",
  "Sociaal zekerheidsrecht",
  "Overig",
];

const allowed_certifications = [
  "VCA",
  "ISO 9001",
  "Erkend Installateur",
  "BOVAG",
  "Techniek Nederland",
];

const allowed_languages = [
  "Nederlands",
  "Engels",
  "Duits",
  "Frans",
  "Pools",
  "Turks",
  "Arabisch",
];

/* ============================================================
   Helpers
============================================================ */
function ensure_array(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string")
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeMultiFields(doc) {
  const out = { ...doc };
  const fields = [
    "specialties",
    "regions",
    "certifications",
    "recognitions",
    "memberships",
    "languages",
  ];
  fields.forEach((f) => {
    if (!Array.isArray(out[f])) out[f] = [];
  });
  return out;
}

/* ============================================================
   1️⃣ LISTS
============================================================ */
router.get("/lists", (req, res) => {
  res.json({
    ok: true,
    specialties: allowed_specialties,
    certifications: allowed_certifications,
    languages: allowed_languages,
  });
});

/* ============================================================
   2️⃣ ADMIN: ALLE BEDRIJVEN (/api/companies/all)
   ⚠️ Belangrijk: moet HOGER staan dan /slug/:slug en /:id
============================================================ */
router.get("/all", async (req, res) => {
  try {
    let companies = await Company.find({})
      .populate({
        path: "owner",
        select: "email",
        options: { strictPopulate: false },
      })
      .lean();

    companies = companies.map((c) => ({
      _id: c._id,
      name: c.name || "(naam onbekend)",
      slug: c.slug || "",
      email: c.email || c.owner?.email || "-",
      owner: c.owner || {},
      isVerified: !!c.isVerified,
      reviewCount: c.reviewCount || 0,
    }));

    return res.json(companies);
  } catch (err) {
    console.error("❌ FOUT in /companies/all:", err);
    return res
      .status(500)
      .json({ ok: false, error: "serverfout bij ophalen bedrijven (all)" });
  }
});

/* ============================================================
   3️⃣ ZOEKEN
============================================================ */
router.get("/search", async (req, res) => {
  try {
    const {
      category = "",
      city = "",
      region = "",
      specialty = "",
      certification = "",
    } = req.query;

    const filters = {};

    if (category) filters.categories = { $regex: new RegExp(category, "i") };
    if (city) filters.city = { $regex: new RegExp(city, "i") };
    if (region) filters.regions = { $regex: new RegExp(region, "i") };
    if (specialty)
      filters.specialties = { $regex: new RegExp(specialty, "i") };
    if (certification)
      filters.certifications = { $regex: new RegExp(certification, "i") };

    let items = await Company.find(filters)
      .sort({ avgRating: -1, reviewCount: -1 })
      .lean();

    items = items.map((c) => normalizeMultiFields(c));

    res.json({ ok: true, items });
  } catch (err) {
    console.error("❌ fout bij zoeken bedrijven:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij zoeken bedrijven" });
  }
});

/* ============================================================
   4️⃣ SLUG ROUTE
============================================================ */
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item)
      return res
        .status(404)
        .json({ ok: false, error: "bedrijf niet gevonden" });

    res.json(normalizeMultiFields(item));
  } catch (err) {
    console.error("❌ fout bij slug:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij ophalen bedrijf" });
  }
});

/* ============================================================
   5️⃣ PUBLIEKE LIJST (LET OP: / MOET BOVEN /:id)
============================================================ */
router.get("/", async (req, res) => {
  try {
    let items = await Company.find({}).lean();
    items = items.map((c) => normalizeMultiFields(c));

    res.json({ ok: true, total: items.length, items });
  } catch (err) {
    console.error("❌ fout bij ophalen bedrijven:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij ophalen bedrijven" });
  }
});

/* ============================================================
   6️⃣ OPHALEN VIA ID (MOET ALTIJD ALS ALLERLAATSTE!)
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const item = await Company.findById(req.params.id).lean();
    if (!item)
      return res
        .status(404)
        .json({ ok: false, error: "bedrijf niet gevonden" });

    res.json(normalizeMultiFields(item));
  } catch (err) {
    console.error("❌ fout bij ophalen via ID:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij ophalen bedrijf" });
  }
});

/* ============================================================
   7️⃣ AANMAKEN
============================================================ */
router.post("/", auth, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      name,
      slug,
      tagline = "",
      description = "",
      categories = [],
      specialties = [],
      regions = [],
      worksNationwide = false,
      certifications = [],
      recognitions = [],
      memberships = [],
      languages = [],
      availability = "",
      city = "",
      phone = "",
      email = "",
      website = "",
    } = body;

    if (!name || !slug)
      return res
        .status(400)
        .json({ ok: false, error: "naam en slug zijn verplicht" });

    const doc = new Company({
      name,
      slug,
      tagline,
      description,
      categories: ensure_array(categories),
      specialties: ensure_array(specialties).filter((s) =>
        allowed_specialties.includes(s)
      ),
      regions: ensure_array(regions),
      worksNationwide: !!worksNationwide,
      certifications: ensure_array(certifications).filter((c) =>
        allowed_certifications.includes(c)
      ),
      recognitions: ensure_array(recognitions),
      memberships: ensure_array(memberships),
      languages: ensure_array(languages).filter((l) =>
        allowed_languages.includes(l)
      ),
      availability,
      city,
      phone,
      email,
      website,
      owner: req.user.id,
    });

    await doc.save();
    res.json({ ok: true, company: doc });
  } catch (err) {
    console.error("❌ fout bij aanmaken bedrijf:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij aanmaken bedrijf" });
  }
});

/* ============================================================
   8️⃣ BIJWERKEN
============================================================ */
router.put("/:id", auth, async (req, res) => {
  try {
    const doc = await Company.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ ok: false, error: "bedrijf niet gevonden" });

    if (!doc.owner || doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "geen toegang" });
    }

    const updates = { ...(req.body || {}) };

    if (updates.specialties)
      updates.specialties = ensure_array(updates.specialties).filter((s) =>
        allowed_specialties.includes(s)
      );

    if (updates.certifications)
      updates.certifications = ensure_array(updates.certifications).filter(
        (c) => allowed_certifications.includes(c)
      );

    if (updates.languages)
      updates.languages = ensure_array(updates.languages).filter((l) =>
        allowed_languages.includes(l)
      );

    ["categories", "specializations", "regions", "recognitions", "memberships"].forEach(
      (f) => {
        if (updates[f]) updates[f] = ensure_array(updates[f]);
      }
    );

    if (typeof updates.worksNationwide === "string")
      updates.worksNationwide = updates.worksNationwide === "true";

    Object.assign(doc, updates);
    await doc.save();

    res.json({ ok: true, company: doc });
  } catch (err) {
    console.error("❌ fout bij bijwerken bedrijf:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij bijwerken bedrijf" });
  }
});

/* ============================================================
   9️⃣ VERWIJDEREN
============================================================ */
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Company.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ ok: false, error: "bedrijf niet gevonden" });

    if (!doc.owner || doc.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ ok: false, error: "geen toegang" });
    }

    await doc.deleteOne();
    res.json({ ok: true, message: "bedrijf verwijderd" });
  } catch (err) {
    console.error("❌ fout bij verwijderen bedrijf:", err);
    res
      .status(500)
      .json({ ok: false, error: "serverfout bij verwijderen bedrijf" });
  }
});

module.exports = router;
