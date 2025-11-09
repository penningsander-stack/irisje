// backend/routes/claims.js
const express = require("express");
const router = express.Router();
const ClaimRequest = require("../models/claimrequest"); // ✅ juiste bestandsnaam in kleine letters
const Company = require("../models/company"); // ✅ idem

// ✅ Nieuw claimverzoek aanmaken
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, companyId } = req.body;
    if (!companyId || !email || !name) {
      return res.status(400).json({ error: "Ontbrekende velden in claimverzoek" });
    }

    const claim = new ClaimRequest({
      name,
      email,
      phone,
      company: companyId,
      createdAt: new Date(),
    });

    await claim.save();

    res.json({ ok: true, message: "Claim succesvol verzonden", claimId: claim._id });
  } catch (error) {
    console.error("❌ Fout bij claimverzoek:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij claimverzoek" });
  }
});

// ✅ Alle claims ophalen (alleen voor beheerder)
router.get("/", async (req, res) => {
  try {
    const claims = await ClaimRequest.find()
      .populate("company", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, total: claims.length, items: claims });
  } catch (error) {
    console.error("❌ Fout bij ophalen claims:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen claims" });
  }
});

module.exports = router;
