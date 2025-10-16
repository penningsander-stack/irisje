// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const Company = require('../models/Company');
const User = require('../models/User');

// ✅ /api/secure/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: 'Ongeldige token' });

    const user = await User.findById(req.user.id);
    const company = await Company.findOne({ user: req.user.id });

    res.json({
      email: user?.email || 'Onbekend',
      role: user?.role || 'company',
      company: company || null,
    });
  } catch (err) {
    console.error('❌ Fout in /secure/me:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen bedrijfsinfo' });
  }
});

module.exports = router;
