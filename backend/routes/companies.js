const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// GET all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single company
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE company
router.delete('/:id', async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bedrijf verwijderd' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
