// backend/routes/claims.js
const express = require('express');
const router = express.Router();
const ClaimRequest = require('../models/ClaimRequest');
const Company = require('../models/Company');

// Nieuw claim-verzoek aanmaken
router.post('/companies/:id/claim', async (req, res) => {
  try {
    const companyId = req.params.id;
    const { contactName, contactEmail, contactPhone, methodRequested } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: 'Bedrijf niet gevonden' });

    const claim = new ClaimRequest({
      companyId,
      contactName,
      contactEmail,
      contactPhone,
      methodRequested: methodRequested || 'email',
      status: 'pending'
    });

    await claim.save();
    res.json({ success: true, message: 'Claim aangemaakt', claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout bij aanmaken claim' });
  }
});

module.exports = router;
