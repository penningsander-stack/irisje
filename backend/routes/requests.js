// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Request = require('../models/Request');     // ✅ hoofdletter R
const Company = require('../models/Company');     // ✅ hoofdletter C
const { verifyToken } = require('../middleware/auth');

// Vind gekoppeld bedrijf bij ingelogde user
async function findCompanyForUser(req) {
  const userId = req.user.id;
  const email = req.user.email;

  let company = await Company.findOne({ user: userId });
  if (!company && mongoose.isValidObjectId(userId)) {
    company = await Company.findOne({ user: new mongoose.Types.ObjectId(userId) });
  }
  if (!company && email) {
    company = await Company.findOne({ email });
  }
  return company;
}

// GET /api/requests  -> lijst aanvragen van dit bedrijf
router.get('/', verifyToken, async (req, res) => {
  try {
    const company = await findCompanyForUser(req);
    if (!company) return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });

    const { q, status } = req.query;
    const query = { company: company._id };
    if (q) {
      query.$or = [
        { customerName: new RegExp(q, 'i') },
        { customerEmail: new RegExp(q, 'i') },
        { message: new RegExp(q, 'i') },
        { customerMessage: new RegExp(q, 'i') },
      ];
    }
    if (status) query.status = status;

    const items = await Request.find(query).sort({ createdAt: -1 });
    res.json(items); // frontend verwacht array
  } catch (err) {
    console.error('❌ GET /api/requests:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen aanvragen' });
  }
});

// GET /api/requests/stats/overview  -> tegels
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const company = await findCompanyForUser(req);
    if (!company) return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 86400000);

    const items = await Request.find({ company: company._id, createdAt: { $gte: since } });
    const stats = {
      total: items.length,
      accepted: items.filter(r => r.status === 'Geaccepteerd').length,
      rejected: items.filter(r => r.status === 'Afgewezen').length,
      followedUp: items.filter(r => r.status === 'Opgevolgd').length,
      since,
    };
    res.json(stats);
  } catch (err) {
    console.error('❌ GET /api/requests/stats/overview:', err);
    res.status(500).json({ message: 'Serverfout bij statistieken' });
  }
});

// PATCH /api/requests/:id/status  -> status bijwerken
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Nieuw', 'Geaccepteerd', 'Afgewezen', 'Opgevolgd'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Ongeldige status' });

    const company = await findCompanyForUser(req);
    if (!company) return res.status(404).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });

    const updated = await Request.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Aanvraag niet gevonden' });

    res.json({ message: 'Status bijgewerkt', request: updated });
  } catch (err) {
    console.error('❌ PATCH /api/requests/:id/status:', err);
    res.status(500).json({ message: 'Kon status niet bijwerken' });
  }
});

module.exports = router;
