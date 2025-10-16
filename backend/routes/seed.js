// backend/routes/seed.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Company = require('../models/Company');

// ✅ Route om testdata te koppelen aan Demo Bedrijf
router.get('/link-demo', async (req, res) => {
  try {
    const company = await Company.findOne({ email: 'demo@irisje.nl' });
    if (!company) {
      return res.status(404).json({ message: 'Demo bedrijf niet gevonden' });
    }

    // ✅ Alle requests zonder bedrijf koppelen aan Demo Bedrijf
    const result = await Request.updateMany(
      { $or: [{ company: null }, { company: { $exists: false } }] },
      { $set: { company: company._id } }
    );

    res.json({
      message: '✅ Testaanvragen gekoppeld aan Demo Bedrijf',
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('❌ Fout bij seeden:', err);
    res.status(500).json({ message: 'Serverfout', error: err.message });
  }
});

module.exports = router;
