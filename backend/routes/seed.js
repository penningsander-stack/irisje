// backend/routes/seed.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Company = require('../models/Company');

// Maak twee testaanvragen voor Demo Bedrijf (veilig idempotent)
router.get('/link-demo', async (_req, res) => {
  try {
    const company = await Company.findOne({ email: 'demo@irisje.nl' });
    if (!company) return res.status(404).json({ message: 'Demo bedrijf niet gevonden' });

    await Request.deleteMany({
      customerEmail: { $in: ['jan.jansen@example.com', 'marieke.deboer@example.com'] },
      company: company._id,
    });

    const docs = await Request.insertMany([
      {
        customerName: 'Jan Jansen',
        customerEmail: 'jan.jansen@example.com',
        customerPhone: '0612345678',
        message: 'Graag offerte voor schilderwerk.',
        customerMessage: 'Graag offerte voor schilderwerk.',
        status: 'Nieuw',
        company: company._id,
      },
      {
        customerName: 'Marieke de Boer',
        customerEmail: 'marieke.deboer@example.com',
        customerPhone: '0622334455',
        message: 'Vraag over onderhoudswerk.',
        customerMessage: 'Vraag over onderhoudswerk.',
        status: 'Nieuw',
        company: company._id,
      },
    ]);

    res.json({ message: '✅ Testaanvragen (her)ingevuld', insertedCount: docs.length });
  } catch (err) {
    console.error('❌ seed/link-demo:', err);
    res.status(500).json({ message: 'Serverfout bij seeden', error: err.message });
  }
});

module.exports = router;
