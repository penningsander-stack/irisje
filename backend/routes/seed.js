// backend/routes/seed.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Company = require('../models/Company');

// ✅ Route om testaanvragen aan te maken voor Demo Bedrijf
router.get('/link-demo', async (req, res) => {
  try {
    const company = await Company.findOne({ email: 'demo@irisje.nl' });
    if (!company) {
      return res.status(404).json({ message: 'Demo bedrijf niet gevonden' });
    }

    // Bestaande aanvragen verwijderen (optioneel)
    await Request.deleteMany({ customerEmail: { $in: ['jan.jansen@example.com', 'marieke.deboer@example.com'] } });

    // ✅ Twee nieuwe testaanvragen toevoegen
    const requests = [
      {
        customerName: 'Jan Jansen',
        customerEmail: 'jan.jansen@example.com',
        customerPhone: '0612345678',
        customerMessage: 'Ik wil graag een offerte voor schilderwerk.',
        status: 'Nieuw',
        company: company._id,
      },
      {
        customerName: 'Marieke de Boer',
        customerEmail: 'marieke.deboer@example.com',
        customerPhone: '0622334455',
        customerMessage: 'Kunnen jullie volgende week langskomen voor een schatting?',
        status: 'Nieuw',
        company: company._id,
      },
    ];

    const inserted = await Request.insertMany(requests);

    res.json({
      message: '✅ Nieuwe testaanvragen aangemaakt en gekoppeld aan Demo Bedrijf',
      insertedCount: inserted.length,
      company: company.name,
    });
  } catch (err) {
    console.error('❌ Fout bij seeden:', err);
    res.status(500).json({ message: 'Serverfout', error: err.message });
  }
});

module.exports = router;
