const express = require('express');
const BlogPost = require('../Models/BlogsModel');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dybotqozo',
  api_key: '176444681733414',
  api_secret: 'Iio2fclIU0VyxjD1iE_qW2tbxTg',
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'blog_images', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Supported formats
  },
});

const upload = multer({ storage });

const router = express.Router();

// Route to save a new blog post
router.post('/saveblog', upload.single('image'), async (req, res) => {
  const { name, title, slug, metaTitle, content, metaDescription, designation, keywords } = req.body;

  if (!name || !title || !slug || !metaTitle || !content || !metaDescription || !designation || !keywords || !req.file) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const newPost = new BlogPost({
      name,
      title,
      slug,
      metaTitle,
      content,
      metaDescription,
      designation,
      keywords: keywords.split(','), // Keywords stored as an array
      image: req.file.path, // Image URL from Cloudinary
    });

    await newPost.save();
    res.json({ success: true, message: 'Blog post added successfully', data: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error adding the post' });
  }
});

// GET route to fetch all blog posts
router.get('/allblogs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 6);
    const skip = (page - 1) * limit;
    
    // Add sort by created_at in descending order
    const blogPosts = await BlogPost.find()
      .sort({ created_at: -1 }) // This line ensures latest posts appear first
      .skip(skip)
      .limit(limit);

    const totalPosts = await BlogPost.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: blogPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        limit,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching blog posts' });
  }
});



// Route to update a blog post
router.put('/updateblog/:slug', upload.single('image'), async (req, res) => {
  const { slug } = req.params;
  const { name, newSlug, title, content, metaTitle, metaDescription, designation, keywords } = req.body;

  try {
    const updateFields = {};
    if (name) updateFields.name = name;
    if (newSlug) updateFields.slug = newSlug;
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;
    if (metaTitle) updateFields.metaTitle = metaTitle;
    if (metaDescription) updateFields.metaDescription = metaDescription;
    if (designation) updateFields.designation = designation;
    if (keywords) updateFields.keywords = keywords.split(',');
    if (req.file) updateFields.image = req.file.path;

    const updatedBlog = await BlogPost.findOneAndUpdate(
      { slug }, // Find by current slug
      { $set: updateFields }, // Update fields
      { new: true, runValidators: true } // Return updated document
    );

    if (!updatedBlog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, message: 'Blog updated successfully', data: updatedBlog });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slug must be unique' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Route to delete a blog post by ID
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await BlogPost.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Route to get the count of blog posts
router.get('/count', async (req, res) => {
  try {
    const blogPostCount = await BlogPost.countDocuments(); // Get count of all blog posts
    res.json({ count: blogPostCount });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blog post count' });
  }
});

module.exports = router;
