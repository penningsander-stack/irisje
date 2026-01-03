// backend/routes/publicRequests.js
// v20260103-OPTION-B-FINAL
// - correcte matching op categories/specialties
// - echte multi-bedrijf verzending (parent + child requests)

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");
const Request = require("../models/request.js");

/**
 * POST /api/publicRequests
 * Nieuwe aanvraag (parent)
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      message,
      category,
      specialty,
      experience,
      approach,
      involvement,
      city,
    } = req.body;

    if (!name || !email || !category) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mail en categorie zijn verplicht",
      });
    }

    const request = await Request.create({
      name,
      email,
      city,
      message,
      category,
      specialty,
      experience,
      approach,
      involvement,
      isParent: true,
      status: "Nieuw",
      source: "public",
    });

    res.json({ ok: true, requestId: request._id });
  } catch (err) {
    console.error("❌ publicRequests POST:", err);
    res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

/**
 * GET /api/publicRequests/:id
 * Aanvraag ophalen + bedrijven matchen
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({
        ok: false,
        error: "Aanvraag niet gevonden",
      });
    }

    const query = {
      categories: request.category,
    };

    if (request.specialty) {
      query.specialties = request.specialty;
    }

    const companies = await Company.find(query)
      .limit(20)
      .select("_id name city avgRating categories isVerified")
      .lean();

    res.json({ ok: true, request, companies });
  } catch (err) {
    console.error("❌ publicRequests GET:", err);
    res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

/**
 * POST /api/publicRequests/:id/send
 * Verzenden naar geselecteerde bedrijven
 */
router.post("/:id/send", async (req, res) => {
  try {
    const { companyIds } = req.body;
    const parent = await Request.findById(req.params.id);

    if (!parent || !parent.isParent) {
      return res.status(404).json({
        ok: false,
        error: "Parent-aanvraag niet gevonden",
      });
    }

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Geen bedrijven geselecteerd",
      });
    }

    const children = [];

    for (const companyId of companyIds) {
      children.push({
        name: parent.name,
        email: parent.email,
        city: parent.city,
        message: parent.message,
        category: parent.category,
        specialty: parent.specialty,
        experience: parent.experience,
        approach: parent.approach,
        involvement: parent.involvement,
        companyId,
        parentRequestId: parent._id,
        source: parent.source,
        status: "Nieuw",
        sentAt: new Date(),
      });
    }

    await Request.insertMany(children);

    parent.selectedCompanyIds = companyIds;
    parent.sentAt = new Date();
    parent.status = "Verstuurd";
    await parent.save();

    res.json({
      ok: true,
      createdCount: children.length,
    });
  } catch (err) {
    console.error("❌ publicRequests SEND:", err);
    res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

module.exports = router;
