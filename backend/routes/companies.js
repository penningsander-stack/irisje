const express = require('express');
const router = express.Router();
const Company = require('../models/company');

// GET alle bedrijven
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET bedrijf op ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Niet gevonden' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST nieuw bedrijf
router.post('/', async (req, res) => {
  try {
    const newCompany = new Company(req.body);
    const saved = await newCompany.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE bedrijf
router.delete('/:id', async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bedrijf verwijderd' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
