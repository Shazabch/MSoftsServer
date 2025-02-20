const express = require('express');
const multer = require('multer'); 
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const sanitizeHtml = require('sanitize-html');
const BlogPost = require('../Models/BlogsModel');
const Blog = require('../Models/BlogsModel');
const BlogContent = require('../Models/BlogContent');
const router = express.Router();
// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// Cloudinary Storage for Direct File Uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, quality: "auto" }]
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
// Sanitize HTML Content (Preserves Image Tags)
const sanitizeContent = (content) => {
  return sanitizeHtml(content, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img", "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "p", "a", "ul", "ol", "nl", "li",
      "b", "i", "strong", "em", "strike", "code", "hr",
      "br", "div", "table", "thead", "caption", "tbody",
      "tr", "th", "td", "pre", "iframe", "span"
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "style", "id"],
      "img": ["src", "alt", "title", "width", "height", "loading"],
      "a": ["href", "target", "rel"]
    },
    allowedSchemes: ['data', 'http', 'https'], // Allow base64 data URLs

    allowedStyles: {
      "*": {
        "color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-size": [/^\d+(?:px|em|%)$/]
      }
    }
  });
};
// Process Content to Convert Base64 Images to Cloudinary URLs
const processContentImages = async (content) => {
  console.log("Original Content Before Processing:", content);

  const regex = /<img[^>]+src="(data:image\/[^;]+;base64,[^"]+)"/g;
  let updatedContent = content;
  let match;
  let foundImages = false;

  while ((match = regex.exec(content)) !== null) {
    foundImages = true;
    const base64Image = match[1];

    try {
      console.log("Uploading base64 image to Cloudinary...");
      const cloudinaryResult = await cloudinary.uploader.upload(base64Image, {
        folder: "blog_images",
      });

      if (cloudinaryResult && cloudinaryResult.secure_url) {
        console.log("Cloudinary Upload Success:", cloudinaryResult.secure_url);
        updatedContent = updatedContent.replace(base64Image, cloudinaryResult.secure_url);
      } else {
        console.error("Cloudinary Upload Failed:", cloudinaryResult);
      }
    } catch (error) {
      console.error("Error uploading base64 image:", error);
    }
  }

  if (!foundImages) {
    console.warn("⚠ No base64 images detected in content!");
  }

  console.log("Updated Content After Processing:", updatedContent);
  return updatedContent;
};
// Extract Image URLs from Processed HTML
const extractImageUrls = (content) => {
  const images = [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const url = match[1];
    if (url.includes("cloudinary")) {  // Ensure only Cloudinary images are saved
      images.push(url);
    }
  }

  return images;
};
router.get('/count', async (req, res) => {
  console.log("hitt")
  try {
    const blogPostCount = await BlogPost.countDocuments(); // Get count of all blog posts
    res.json({ count: blogPostCount });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blog post count' });
  }
});

router.put("/toggle-feature/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    blog.feature = !blog.feature; // Toggle feature value
    await blog.save();

    res.json({ success: true, feature: blog.feature });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
})
// Create a New Blog Post
router.post("/saveblog", upload.single("image"), async (req, res) => {
  try {
    const { name, title, slug, metaTitle, content, metaDescription, designation, keywords } = req.body;

    if (!name || !title || !slug || !metaTitle || !content || !metaDescription || !designation || !keywords || !req.file) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    console.log("Sanitizing content...");
    const sanitizedContent = sanitizeContent(content);
    console.log("Processed Sanitized Content:", sanitizedContent);

    console.log("Processing images in content...");
    const finalContent = await processContentImages(sanitizedContent);

    const images = extractImageUrls(finalContent);

    console.log("Saving blog content...");
const blogContent = await BlogContent.create({
  content: finalContent,
  images: images.map((url) => ({ url })) // ✅ Convert string URLs to object format
});
    console.log("Saving blog post...");
    const post = await BlogPost.create({
      name,
      title,
      slug,
      metaTitle,
      contentId: blogContent._id,
      metaDescription,
      designation,
      keywords: keywords.split(",").map((k) => k.trim()),
      image: req.file.path,
    });

    console.log("Blog post saved successfully!");
    res.status(201).json({ success: true, data: post });

  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, message: "Error creating blog post" });
  }
});
// Update blog post
router.put('/updateblog/:slug', upload.single('image'), async (req, res) => {
  try {
    const { slug } = req.params;
    let { name, title, newSlug, metaTitle, content, metaDescription, designation, keywords } = req.body;

    // ✅ Fix keywords issue - Ensure it's always an array
    try {
      if (typeof keywords === "string") {
        keywords = JSON.parse(keywords);
      }
      if (!Array.isArray(keywords)) {
        keywords = keywords.split(',').map(k => k.trim());
      }
    } catch (error) {
      keywords = keywords.split(',').map(k => k.trim());
    }

    const post = await BlogPost.findOne({ slug }).populate('contentId');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const sanitizedContent = sanitizeContent(content);
    const images = extractImageUrls(sanitizedContent).map(url => ({ url })); // ✅ Convert URLs to objects

    // Update blog content
    await BlogContent.findByIdAndUpdate(post.contentId._id, {
      content: sanitizedContent,
      images, // ✅ Now correctly formatted
      updated_at: new Date()
    });

    const updateData = {
      name,
      title,
      metaTitle,
      metaDescription,
      designation,
      keywords, // ✅ Now properly formatted as an array
      updated_at: new Date()
    };

    if (newSlug && newSlug !== slug) {
      const slugExists = await BlogPost.findOne({ slug: newSlug });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'A blog post with this slug already exists'
        });
      }
      updateData.slug = newSlug;
    }

    if (req.file) {
      if (post.image) {
        const publicId = post.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      updateData.image = req.file.path;
    }

    const updatedPost = await BlogPost.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    ).populate('contentId');

    res.json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating blog post'
    });
    console.error('Update post error:', error);
  }
});

// Get all blog posts
router.get('/allblogs', async (req, res) => {
  console.log("all blog api hit")
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    console.log(`Fetching blogs - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { 'contentId.content': { $regex: search, $options: 'i' } },
            { keywords: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      : {};

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate({
          path: 'contentId',
          select: 'content', // Fetch only the 'content' field from the related collection
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      BlogPost.countDocuments(query)
    ]);

    console.log(`Total posts found: ${total}`);

    // Log only content field of contentId
    posts.forEach(post => {
      console.log(`Post ID: ${post._id}, Title: ${post.title}`);
      if (post.contentId && post.contentId.content) {
        console.log(`Content: ${post.contentId.content}`);
      } else {
        console.log(`Content: No content available`);
      }
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog posts'
    });
  }
});
// Delete blog post
router.delete('/delete/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('contentId');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Delete featured image from Cloudinary
    if (post.image) {
      const publicId = post.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete content images from Cloudinary
    if (post.contentId && post.contentId.images) {
      for (const image of post.contentId.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    // Delete blog content
    await BlogContent.findByIdAndDelete(post.contentId._id);

    // Delete blog post
    await post.deleteOne();

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting blog post'
    });
  }
});

// Get single blog post
router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug }).populate('contentId');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog post'
    });
  }
});

module.exports = router;