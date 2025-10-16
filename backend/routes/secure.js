// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');

// ✅ Authenticated user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }

    // Zoek gekoppeld bedrijf
    const company = await Company.findOne({ user: user._id });
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      companyName: company ? company.name : null,
    });
  } catch (err) {
    console.error('❌ secure.js fout:', err.message);
    res.status(500).json({ message: 'Serverfout' });
  }
});

module.exports = router;
