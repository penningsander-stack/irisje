// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const Company = require('../models/company');
const auth = require('../middleware/auth');

// ✅ Alle aanvragen voor het ingelogde bedrijf ophalen
router.get('/company', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Zoek het bedrijf dat gekoppeld is aan deze user
    const company = await Company.findOne({ user: userId });
    if (!company) return res.status(404).json({ message: 'Geen gekoppeld bedrijf gevonden' });

    // Zoek alle aanvragen die aan dit bedrijf zijn gekoppeld
    const requests = await Request.find({ company: company._id });

    // Tel statistieken
    const stats = {
      total: requests.length,
      accepted: requests.filter(r => r.status === 'Geaccepteerd').length,
      rejected: requests.filter(r => r.status === 'Afgewezen').length,
      followedUp: requests.filter(r => r.status === 'Opgevolgd').length
    };

    res.json({ company, stats, requests });
  } catch (err) {
    console.error('❌ Fout bij ophalen aanvragen:', err.message);
    res.status(500).json({ message: 'Serverfout bij ophalen aanvragen' });
  }
});

// ✅ Status van een aanvraag bijwerken
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(id, { status }, { new: true });
    res.json(request);
  } catch (err) {
    console.error('❌ Fout bij statusupdate:', err.message);
    res.status(500).json({ message: 'Kon status niet bijwerken' });
  }
});

module.exports = router;
