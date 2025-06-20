const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  slug: { type: String, required: true },
  category: { type: [String], required: true },
  backgroundImage: { type: String },
  portfolioImage: { type: String },
  thumbnail: { type: String },
  description: { type: String, required: true },
  client: { type: String },
  clientLogo: { type: String },
  technologies: { type: [String], required: true },
  features: { type: [String] },
  images: { type: [String] },
  challenge: { type: String },
  solution: { type: String },
  results: { type: String },
  testimonial: { type: String },
  regions: { type: [String] },
  country: { type: String },
  liveUrl: { type: String, required: true },
  status: { type: String, enum: ['listed', 'unlisted'], default: 'listed' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);