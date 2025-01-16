const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  designation: { type: String, required: true },
  keywords: { type: [String], required: true },
  created_at: { type: Date, default: Date.now },  // Store creation date automatically
  updated_at: { type: Date, default: Date.now },
});

// Create the model from the schema
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;
