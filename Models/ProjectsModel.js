// models/Project.js

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  technologies: { type: [String], required: true },
  liveUrl: { type: String, required: false },
  category: { type: String, required: true },  // Add category field
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
