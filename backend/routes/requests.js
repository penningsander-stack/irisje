// backend/routes/requests.js
// ✅ Routes voor aanvragen (requests)

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const Request = require('../models/Request');
const Company = require('../models/Company');

// 📦 Alle aanvragen voor het ingelogde bedrijf ophalen
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('❌ Fout bij ophalen aanvragen:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen aanvragen' });
  }
});

// 📊 Statistieken ophalen
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;

    const total = await Request.countDocuments({ company: companyId });
    const accepted = await Request.countDocuments({ company: companyId, status: 'Geaccepteerd' });
    const rejected = await Request.countDocuments({ company: companyId, status: 'Afgewezen' });
    const followedUp = await Request.countDocuments({ company: companyId, status: 'Opgevolgd' });

    res.json({ total, accepted, rejected, followedUp });
  } catch (err) {
    console.error('❌ Fout bij ophalen statistieken:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen statistieken' });
  }
});

// 📄 Nieuw verzoek aanmaken (alleen test / seed)
router.post('/create', async (req, res) => {
  try {
    const newReq = new Request(req.body);
    await newReq.save();
    res.json({ message: '✅ Nieuwe aanvraag aangemaakt', id: newReq._id });
  } catch (err) {
    console.error('❌ Fout bij aanmaken aanvraag:', err);
    res.status(500).json({ message: 'Serverfout bij aanmaken aanvraag' });
  }
});

module.exports = router;
