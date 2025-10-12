const express = require('express');
const router = express.Router();
const Review = require('../models/review');

// GET reviews van een specifiek bedrijf
router.get('/company/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ company: req.params.companyId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST nieuwe review
router.post('/', async (req, res) => {
  const { company, author, rating, comment } = req.body;

  // Validatie: alles verplicht
  if (!company || !author || rating == null || !comment) {
    return res.status(400).json({ message: 'Alle velden zijn verplicht.' });
  }

  // Validatie: rating moet tussen 1 en 5
  const r = parseInt(rating);
  if (isNaN(r) || r < 1 || r > 5) {
    return res.status(400).json({ message: 'Beoordeling moet tussen 1 en 5 liggen.' });
  }

  try {
    const review = new Review({
      company,
      author,
      rating: r,
      comment
    });
    const saved = await review.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
