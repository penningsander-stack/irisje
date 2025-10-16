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
      console.log('⚠️ Geen gebruiker gevonden voor ID:', req.user.id);
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }

    const company = await Company.findOne({ user: user._id });
    console.log('🪶 [secure.js] Gevonden user:', user.email);
    console.log('🪶 [secure.js] Gevonden company:', company ? company.name : '(geen)');

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
    console.error('❌ [secure.js] Fout:', err.message);
    res.status(500).json({ message: 'Serverfout', error: err.message });
  }
});

module.exports = router;
