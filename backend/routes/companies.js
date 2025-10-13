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

// GET één bedrijf
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

// PUT: bedrijf bijwerken
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Niet gevonden' });
    const { name, category, location, description } = req.body;
    if (name) company.name = name;
    if (category) company.category = category;
    if (location) company.location = location;
    if (description) company.description = description;
    const updated = await company.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE: bedrijf verwijderen
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Niet gevonden' });
    await company.remove();
    res.json({ message: 'Bedrijf verwijderd' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
