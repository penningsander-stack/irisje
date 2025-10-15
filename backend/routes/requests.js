// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Company = require('../models/Company');
const { verifyToken } = require('../middleware/auth');

// 🔍 Log helper (alleen tijdelijk voor debug)
const log = (...args) => console.log('🪶 [requests.js]', ...args);

// 📬 Nieuwe aanvraag aanmaken
router.post('/', async (req, res) => {
  try {
    const newRequest = await Request.create(req.body);
    res.status(201).json(newRequest);
  } catch (err) {
    console.error('❌ Fout bij aanmaken aanvraag:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// 📋 Aanvragen ophalen (dashboard)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    log('Gebruiker-ID uit token:', userId);

    // Kijk eerst of er bedrijven zijn
    const allCompanies = await Company.find({});
    log('Aantal bedrijven in DB:', allCompanies.length);

    // Toon de eerste 1 of 2 bedrijven in logs (alleen voor test)
    if (allCompanies.length > 0) {
      log('Eerste bedrijf:', {
        id: allCompanies[0]._id.toString(),
        name: allCompanies[0].name,
        user: allCompanies[0].user?.toString(),
      });
    }

    // Probeer zowel string- als ObjectId-vergelijking
    let company = await Company.findOne({ user: userId });
    if (!company && mongoose.isValidObjectId(userId)) {
      company = await Company.findOne({ user: new mongoose.Types.ObjectId(userId) });
    }

    if (!company) {
      log('⚠️ Geen bedrijf gevonden voor userId:', userId);
      return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
    }

    log('✅ Bedrijf gevonden:', company.name);

    const { q, status } = req.query;
    const query = { company: company._id };

    if (q) {
      query.$or = [
        { customerName: new RegExp(q, 'i') },
        { customerEmail: new RegExp(q, 'i') }
      ];
    }
    if (status) query['statusByCompany.status'] = status;

    const items = await Request.find(query).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error('❌ Fout bij ophalen aanvragen:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// 🟢 Status bijwerken
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    let company = await Company.findOne({ user: userId });
    if (!company && mongoose.isValidObjectId(userId)) {
      company = await Company.findOne({ user: new mongoose.Types.ObjectId(userId) });
    }

    if (!company) {
      return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Aanvraag niet gevonden' });

    const existingStatus = request.statusByCompany.find(
      s => s.company.toString() === company._id.toString()
    );

    if (existingStatus) {
      existingStatus.status = status;
      existingStatus.updatedAt = new Date();
    } else {
      request.statusByCompany.push({
        company: company._id,
        status,
        updatedAt: new Date()
      });
    }

    await request.save();
    res.json({ message: 'Status bijgewerkt', status });
  } catch (err) {
    console.error('❌ Fout bij statusupdate:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// 📈 Statistieken
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let company = await Company.findOne({ user: userId });
    if (!company && mongoose.isValidObjectId(userId)) {
      company = await Company.findOne({ user: new mongoose.Types.ObjectId(userId) });
    }

    if (!company) {
      return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
    }

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const items = await Request.find({
      'statusByCompany.company': company._id,
      createdAt: { $gte: since }
    });

    const stats = {
      total: items.length,
      accepted: items.filter(r => r.statusByCompany.some(s => s.status === 'Geaccepteerd')).length,
      rejected: items.filter(r => r.statusByCompany.some(s => s.status === 'Afgewezen')).length,
      followedUp: items.filter(r => r.statusByCompany.some(s => s.status === 'Opgevolgd')).length,
      since
    };

    res.json(stats);
  } catch (err) {
    console.error('❌ Fout bij statistieken:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
