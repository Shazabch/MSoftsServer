// routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const Testimonial = require('../Models/TestimonialModel'); // Adjust the path as needed
// POST: Add a new testimonial
router.post('/submit', async (req, res) => {
  try {
    const { name, userName, title, quote, comment, rating } = req.body;

    // Generate the avatar URL (using ui-avatars.com as an example)
    const avatarUrl = `https://ui-avatars.com/api/?name=${name}`;

    // Create a new testimonial
    const newTestimonial = new Testimonial({
      name,
      userName,
      title,
      quote,
      comment,
      rating,
      avatarUrl, // Save the avatar URL
    });

    // Save the testimonial to the database
    const savedTestimonial = await newTestimonial.save();
    res.status(201).json(savedTestimonial); // Return the saved testimonial
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Fetch all testimonials
router.get('/feedbacks', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials); // Return the feedbacks
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH: Approve multiple testimonials
router.patch('/approve-multiple', async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of testimonial IDs

    // Update multiple testimonials to approved status
    const updatedTestimonials = await Testimonial.updateMany(
      { _id: { $in: ids } },
      { approved: true }
    );

    if (updatedTestimonials.nModified === 0) {
      return res.status(404).json({ message: 'No testimonials found to approve' });
    }

    return res.status(200).json({ message: 'Testimonials approved', updatedTestimonials });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PATCH: Unapprove a testimonial by ID
router.patch('/unapprove/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the testimonial and update its approved status to false
    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      { approved: false },
      { new: true } // Return the updated document
    );

    if (!updatedTestimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    return res.status(200).json({
      message: 'Testimonial unapproved successfully',
      updatedTestimonial,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
