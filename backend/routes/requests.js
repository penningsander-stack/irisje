// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Request = require('../models/Request'); // ✅ hoofdletter R
const Company = require('../models/Company'); // ✅ hoofdletter C
const { verifyToken } = require('../middleware/auth'); // ✅ juiste import

// Hulpfunctie: bedrijf vinden voor ingelogde user (op id of e-mail)
async function findCompanyForUser(req) {
  const userId = req.user.id;
  const userEmail = req.user.email;

  // 1) direct op user-id
  let company = await Company.findOne({ user: userId });

  // 2) als string niet matcht, probeer ObjectId
  if (!company && mongoose.isValidObjectId(userId)) {
    company = await Company.findOne({ user: new mongoose.Types.ObjectId(userId) });
  }

  // 3) fallback op e-mail
  if (!company && userEmail) {
    company = await Company.findOne({ email: userEmail });
  }

  return company;
}

// 📋 Lijst van aanvragen voor dit bedrijf (verwacht door frontend)
router.get('/', verifyToken, async (req, res) => {
  try {
    const company = await findCompanyForUser(req);
    if (!company) {
      return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
    }

    // optionele filters
    const { q, status } = req.query;
    const query = { company: company._id };

    if (q) {
      query.$or = [
        { customerName: new RegExp(q, 'i') },
        { customerEmail: new RegExp(q, 'i') },
        { message: new RegExp(q, 'i') }
      ];
    }
    if (status) {
      query.status = status;
    }

    const items = await Request.find(query).sort({ createdAt: -1 });
    res.json(items); // ✅ frontend verwacht een array
  } catch (err) {
    console.error('❌ Fout bij ophalen aanvragen:', err.message);
    res.status(500).json({ message: 'Serverfout bij ophalen aanvragen' });
  }
});

// 🟢 Status updaten (Geaccepteerd / Afgewezen / Opgevolgd / Nieuw)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Nieuw', 'Geaccepteerd', 'Afgewezen', 'Opgevolgd'].includes(status)) {
      return res.status(400).json({ message: 'Ongeldige status' });
    }

    // Zeker stellen dat de aanvraag bij dit bedrijf hoort
    const company = await findCompanyForUser(req);
    if (!company) {
      return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
    }

    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: 'Aanvraag niet gevonden' });

    res.json({ message: 'Status bijgewerkt', request });
  } catch (err) {
    console.error('❌ Fout bij statusupdate:', err.message);
    res.status(500).json({ message: 'Kon status niet bijwerken' });
  }
});

// 📈 Statistieken voor de tegels
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const company = await findCompanyForUser(req);
    if (!company) {
      return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
    }

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const items = await Request.find({
      company: company._id,
      createdAt: { $gte: since }
    });

    const stats = {
      total: items.length,
      accepted: items.filter(r => r.status === 'Geaccepteerd').length,
      rejected: items.filter(r => r.status === 'Afgewezen').length,
      followedUp: items.filter(r => r.status === 'Opgevolgd').length,
      since
    };

    res.json(stats);
  } catch (err) {
    console.error('❌ Fout bij statistieken:', err.message);
    res.status(500).json({ message: 'Serverfout bij statistieken' });
  }
});

module.exports = router;
