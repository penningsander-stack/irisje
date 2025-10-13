const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// 📥 Review toevoegen
router.post('/', async (req, res) => {
  const { company, author, rating, comment } = req.body;

  if (!company || !author || rating == null || !comment) {
    return res.status(400).json({ message: 'Alle velden zijn verplicht.' });
  }

  const numericRating = parseInt(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Beoordeling moet tussen 1 en 5 zijn.' });
  }

  try {
    const newReview = new Review({
      company,
      author,
      rating: numericRating,
      comment
    });
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📤 Reviews ophalen per bedrijf
router.get('/company/:companyId', async (req, res) => {
  const { companyId } = req.params;

  try {
    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
