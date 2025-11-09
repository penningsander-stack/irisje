// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

// LET OP: hier alleen kleine letters gebruiken, want je modellen heten nu zo:
const Request = require("../models/request");
const Company = require("../models/company");

// ✅ Publieke aanvragen ophalen
// GET /api/publicRequests
router.get("/", async (req, res) => {
  try {
    // simpele, veilige variant: pak de nieuwste 50
    const requests = await Request.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      ok: true,
      total: requests.length,
      items: requests,
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen public requests:", err);
    res.status(500).json({ error: "Serverfout bij ophalen public requests" });
  }
});

// ✅ Publieke aanvragen voor één bedrijf (optioneel, maar je had Company hier al nodig)
// GET /api/publicRequests/company/:slug
router.get("/company/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const company = await Company.findOne({ slug }).lean();
    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden" });
    }

    const requests = await Request.find({ company: company._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
      },
      total: requests.length,
      items: requests,
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen public requests voor bedrijf:", err);
    res.status(500).json({ error: "Serverfout bij ophalen public requests voor bedrijf" });
  }
});

module.exports = router;
