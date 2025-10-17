// backend/routes/requests.js
// ✅ Haalt aanvragen + statistieken op voor dashboard

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const Request = require('../models/Request');

// 📊 Statistieken
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const total = await Request.countDocuments({});
    const accepted = await Request.countDocuments({ status: 'Geaccepteerd' });
    const rejected = await Request.countDocuments({ status: 'Afgewezen' });
    const followedUp = await Request.countDocuments({ status: 'Opgevolgd' });

    res.json({ total, accepted, rejected, followedUp });
  } catch (err) {
    console.error('❌ Fout in /requests/stats/overview:', err);
    res.status(500).json({ message: 'Serverfout bij statistieken' });
  }
});

// 📬 Aanvragenlijst
router.get('/', verifyToken, async (req, res) => {
  try {
    const requests = await Request.find({});
    res.json(requests);
  } catch (err) {
    console.error('❌ Fout in /requests:', err);
    res.status(500).json({ message: 'Serverfout bij aanvragen' });
  }
});

module.exports = router;
