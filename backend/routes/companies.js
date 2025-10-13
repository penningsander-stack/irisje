const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// Get all companies
router.get('/', async (req, res) => {
  const companies = await Company.find();
  res.json(companies);
});

// Get single company by ID
router.get('/:id', async (req, res) => {
  const company = await Company.findById(req.params.id);
  res.json(company);
});

// Add a new company
router.post('/', async (req, res) => {
  const company = new Company(req.body);
  await company.save();
  res.status(201).json(company);
});

// Update a company
router.put('/:id', async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(company);
});

// Delete a company
router.delete('/:id', async (req, res) => {
  await Company.findByIdAndDelete(req.params.id);
  res.json({ message: 'Bedrijf verwijderd' });
});

module.exports = router;
