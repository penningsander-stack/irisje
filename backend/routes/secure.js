// backend/routes/secure.js
// ✅ Geeft bedrijfsinformatie terug voor ingelogde gebruiker

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const Company = require('../models/Company');

// GET /api/secure/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    // Haal company info op uit database
    const company = await Company.findOne({ _id: req.user.id });
    res.json({
      email: req.user.email,
      role: req.user.role,
      company: company
        ? {
            name: company.name,
            category: company.category,
          }
        : { name: 'Demo Bedrijf', category: 'Algemeen' },
    });
  } catch (err) {
    console.error('❌ Fout in /secure/me:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen profiel' });
  }
});

module.exports = router;
