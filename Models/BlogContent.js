const mongoose = require('mongoose');

const blogContentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  images: [{ url: String }], // Expects an array of objects with a 'url' key
}, { timestamps: true }); // ✅ Automatically adds createdAt & updatedAt

const BlogContent = mongoose.model('BlogContent', blogContentSchema);

module.exports = BlogContent;
