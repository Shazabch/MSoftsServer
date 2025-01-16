const express = require('express');
const BlogPost = require('../Models/BlogsModel');
const multer = require('multer');
const path = require('path');

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../Multer/Uploads')); // Store files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the filename to avoid overwriting
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage });

// Create a new router instance
const router = express.Router();

// POST a new blog post with image upload
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
      image: req.file.path,
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
    const blogPosts = await BlogPost.find(); // Find all blog posts in the database
    res.json({ success: true, data: blogPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching blog posts' });
  }
});

router.put("/updateblog/:slug", upload.single("image"), async (req, res) => {
  const { slug } = req.params;
  const { name, newSlug, title, content, metaTitle, metaDescription, designation, keywords } = req.body;

  try {
    

    // Build update object dynamically
    const updateFields = {};
    if (name) updateFields.name = name;
    if (newSlug) updateFields.slug = newSlug;
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;
    if (metaTitle) updateFields.metaTitle = metaTitle;
    if (metaDescription) updateFields.metaDescription = metaDescription;
    if (designation) updateFields.designation = designation;
    if (keywords) updateFields.keywords = keywords.split(",");
    if (req.file) updateFields.image = req.file.path;

    console.log("Update Fields:", updateFields);

    // Perform the update
    const updatedBlog = await BlogPost.findOneAndUpdate(
      { slug }, // Find by current slug
      { $set: updateFields }, // Update fields
      { new: true, runValidators: true } // Return updated document
    );

    if (!updatedBlog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true, message: "Blog updated successfully", data: updatedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Slug must be unique" });
    }

    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});






// Delete blog by ID
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await BlogPost.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return res.status(500).json({ success: false, message: "Server error", error });
  }
});
router.get('/count', async (req, res) => {
  try {
    const blogPostCount = await BlogPost.countDocuments(); // Get count of all blog posts
    res.json({ count: blogPostCount });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blog post count' });
  }
});
module.exports = router;
