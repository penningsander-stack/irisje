const express = require('express');
const router = express.Router();
const Review = require('../models/review');

// GET reviews van een bedrijf
router.get('/company/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ company: req.params.companyId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: nieuwe review
router.post('/', async (req, res) => {
  const { company, author, rating, comment } = req.body;
  if (!company || !author || rating == null || !comment) {
    return res.status(400).json({ message: 'Alle velden verplicht.' });
  }
  const rnum = parseInt(rating);
  if (isNaN(rnum) || rnum < 1 || rnum > 5) {
    return res.status(400).json({ message: 'Rating moet tussen 1 en 5 zijn.' });
  }
  try {
    const review = new Review({ company, author, rating: rnum, comment });
    const saved = await review.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: review bewerken
router.put('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review niet gevonden' });
    const { author, rating, comment } = req.body;
    if (author) review.author = author;
    if (rating != null) {
      const rnum = parseInt(rating);
      if (!isNaN(rnum) && rnum >= 1 && rnum <= 5) {
        review.rating = rnum;
      }
    }
    if (comment) review.comment = comment;
    const updated = await review.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE: review verwijderen
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review niet gevonden' });
    await review.remove();
    res.json({ message: 'Review verwijderd' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
