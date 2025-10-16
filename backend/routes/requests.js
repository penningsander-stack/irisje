// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Company = require('../models/Company');
const auth = require('./auth'); // volgens jouw structuur (geen middleware-map)

// ✅ Alle aanvragen ophalen voor het ingelogde bedrijf
router.get('/', auth, async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Geen bedrijf gevonden' });

    const requests = await Request.find({ company: company._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('❌ Fout bij ophalen aanvragen:', err);
    res.status(500).json({ message: 'Serverfout' });
  }
});

// ✅ Statistieken ophalen
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Geen bedrijf gevonden' });

    const all = await Request.find({ company: company._id });
    const stats = {
      total: all.length,
      accepted: all.filter(r => r.status === 'Geaccepteerd').length,
      rejected: all.filter(r => r.status === 'Afgewezen').length,
      followedUp: all.filter(r => r.status === 'Opgevolgd').length
    };
    res.json(stats);
  } catch (err) {
    console.error('❌ Fout bij ophalen stats:', err);
    res.status(500).json({ message: 'Serverfout' });
  }
});

// ✅ Status wijzigen
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Nieuw', 'Geaccepteerd', 'Afgewezen', 'Opgevolgd'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Ongeldige statuswaarde' });
    }

    const company = await Company.findOne({ user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Geen bedrijf gevonden' });

    const updated = await Request.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Aanvraag niet gevonden' });
    res.json({ message: 'Status bijgewerkt', request: updated });
  } catch (err) {
    console.error('❌ Fout bij status update:', err);
    res.status(500).json({ message: 'Serverfout' });
  }
});

module.exports = router;
