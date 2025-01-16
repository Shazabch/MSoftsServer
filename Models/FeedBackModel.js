// models/Testimonial.js
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userName: { type: String, required: true },
  title: { type: String, required: true },
  quote: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  approved: { type: Boolean, default: false }, // Add this field
  avatarUrl: String, // Field to store the image URL

});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;
