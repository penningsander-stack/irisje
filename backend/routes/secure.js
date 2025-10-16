// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');

router.get('/me', verifyToken, async (req, res) => {
  try {
    console.log('🪶 [secure.js] Token payload:', req.user);

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      console.log('⚠️ Gebruiker niet gevonden voor ID:', req.user.id);
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }

    const company = await Company.findOne({ user: user._id });
    if (company) {
      console.log('✅ Bedrijf gevonden:', company.name);
    } else {
      console.log('⚠️ Geen bedrijf gevonden voor gebruiker:', user.email);
    }

    // ✅ Altijd duidelijk antwoord geven
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      company: company
        ? {
            id: company._id,
            name: company.name,
            email: company.email,
            category: company.category,
          }
        : null,
    });
  } catch (err) {
    console.error('❌ secure.js fout:', err.message);
    res.status(500).json({ message: 'Serverfout', error: err.message });
  }
});

module.exports = router;
