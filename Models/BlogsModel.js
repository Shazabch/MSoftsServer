const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot be more than 200 characters']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogContent',
    required: [true, 'Content reference is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true
  },
  metaTitle: {
    type: String,
    required: [true, 'Meta title is required'],
    trim: true
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    required: [true, 'Featured image is required']
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updated_at field on save
blogPostSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;