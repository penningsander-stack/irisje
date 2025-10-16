// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const auth = require('./auth');
const Company = require('../models/Company');
const User = require('../models/User');

router.get('/me', auth, async (req, res) => {
  try {
    console.log('🧩 [secure.js] Token payload →', req.user);

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('❌ Geen user gevonden met id:', req.user.id);
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }

    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      console.log('⚠️ Geen bedrijf gevonden voor user:', req.user.id);
    } else {
      console.log('✅ Gevonden bedrijf:', company.name);
    }

    res.json({ ...user.toObject(), company });
  } catch (err) {
    console.error('💥 /secure/me serverfout:', err);
    res.status(500).json({ message: err.message || 'Serverfout' });
  }
});

module.exports = router;
