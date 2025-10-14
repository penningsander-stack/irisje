const express = require('express');
const router = express.Router();
const Review = require('../models/review');

// GET reviews voor bedrijf
router.get('/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.params.companyId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST nieuwe review
router.post('/:companyId', async (req, res) => {
  try {
    const review = new Review({
      companyId: req.params.companyId,
      reviewer: req.body.reviewer,
      rating: req.body.rating,
      comment: req.body.comment
    });
    const saved = await review.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE review
router.delete('/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review verwijderd' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
