// backend/routes/secure.js
// ✅ Geeft bedrijfsinformatie terug voor het ingelogde account

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const Company = require('../models/Company');
const User = require('../models/User');

// GET /api/secure/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.warn('⚠️ Geen geldige user in token');
      return res.status(401).json({ message: 'Ongeldige token' });
    }

    // Haal user en bedrijf op
    const user = await User.findById(req.user.id);
    const company = await Company.findOne({ user: req.user.id });

    if (!user) return res.status(404).json({ message: 'Gebruiker niet gevonden' });

    res.json({
      email: user.email,
      role: user.role,
      company: company
        ? {
            name: company.name,
            category: company.category,
            address: company.address,
            phone: company.phone,
            website: company.website,
          }
        : null,
    });
  } catch (err) {
    console.error('❌ Fout in /secure/me:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen bedrijfsinfo' });
  }
});

module.exports = router;
