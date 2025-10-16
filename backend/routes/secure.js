// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const auth = require('./auth');
const Company = require('../models/Company');
const User = require('../models/User');

// ✅ /secure/me – geeft info over de ingelogde gebruiker en bedrijf
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Gebruiker niet gevonden' });

    const company = await Company.findOne({ user: req.user.id });
    res.json({ ...user.toObject(), company });
  } catch (err) {
    console.error('❌ Fout in /secure/me:', err);
    res.status(500).json({ message: 'Serverfout' });
  }
});

module.exports = router;
