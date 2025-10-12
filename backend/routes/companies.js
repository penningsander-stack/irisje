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
  const { name, category, location, description } = req.body;

  if (!name || !category || !location || !description) {
    return res.status(400).json({ message: 'Alle velden zijn verplicht.' });
  }

  try {
    const newCompany = new Company({ name, category, location, description });
    const saved = await newCompany.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
