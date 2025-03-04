const express = require("express");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Project = require("../Models/ProjectsModel");

const router = express.Router();
router.get("/count", async (req, res) => {
  try {
    const count = await Project.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching project count" });
  }
});
// Configure Cloudinary
cloudinary.config({
  cloud_name: "dybotqozo",
  api_key: "176444681733414",
  api_secret: "Iio2fclIU0VyxjD1iE_qW2tbxTg",
});

// Configure Cloudinary storage for multiple file uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "project_images",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// Helper function to handle file uploads
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// Add a New Project
router.post("/add", upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'clientLogo', maxCount: 1 },
  { name: 'portfolioImage', maxCount: 1 }, // Added portfolio image
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      client,
      technologies,
      features,
      challenge,
      solution,
      results,
      testimonial,
      regions,
      category,
      liveUrl: liveurl,
      status = 'listed' // Default to listed if not provided
    } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Handle file uploads
    const backgroundImage = req.files?.backgroundImage?.[0] ? await uploadToCloudinary(req.files.backgroundImage[0]) : null;
    const clientLogo = req.files?.clientLogo?.[0] ? await uploadToCloudinary(req.files.clientLogo[0]) : null;
    const portfolioImage = req.files?.portfolioImage?.[0] ? await uploadToCloudinary(req.files.portfolioImage[0]) : null;
    const images = req.files?.images ? await Promise.all(req.files.images.map(file => uploadToCloudinary(file))) : [];

    const newProject = new Project({
      title,
      subtitle,
      slug,
      category: JSON.parse(category),
      backgroundImage,
      portfolioImage, // Added portfolio image
      description,
      client,
      clientLogo,
      technologies: JSON.parse(technologies),
      features: features ? JSON.parse(features) : [],
      images,
      challenge,
      solution,
      results,
      testimonial,
      regions: regions ? JSON.parse(regions) : [],
      liveUrl: liveurl,
      status
    });

    await newProject.save();
    res.status(201).json({ message: "Project added successfully", project: newProject });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Failed to add project", error: error.message });
  }
});

// Fetch All Projects
router.get("/show", async (req, res) => {
  const { category, status } = req.query;

  try {
    let query = {};
    
    // Add category filter if specified
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Add status filter if specified
    if (status) {
      query.status = status;
    }
    
    const projects = await Project.find(query);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

// Update project status
router.patch("/update-status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['listed', 'unlisted'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be 'listed' or 'unlisted'" });
  }
  
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(200).json({ message: "Project status updated successfully", project: updatedProject });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ message: "Failed to update project status", error: error.message });
  }
});

// Update an Existing Project
router.put("/update/:id", upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'clientLogo', maxCount: 1 },
  { name: 'portfolioImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'existingImages', maxCount: 10 } // Add this line
]), async (req, res) => {
  const { id } = req.params;
  try {
    const {
      title,
      subtitle,
      description,
      client,
      technologies,
      features,
      challenge,
      solution,
      results,
      testimonial,
      regions,
      category,
      liveUrl,
      status,
      existingImages // Parse existing images from request
    } = req.body;

    // Generate new slug if title changed
    const slug = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    : "default-slug";
  
    const updatedData = {
      title,
      subtitle,
      slug,
      category: category ? JSON.parse(category) : [],
      description,
      client,
      technologies: technologies ? JSON.parse(technologies) : [],
      features: features ? JSON.parse(features) : [],
      challenge,
      solution,
      results,
      testimonial,
      regions: regions ? JSON.parse(regions) : [],
      liveUrl,
      status,
    };
    
    // Parse existing images if provided
    let existingImagesArray = [];
    if (existingImages) {
      try {
        existingImagesArray = JSON.parse(existingImages);
      } catch (error) {
        console.error('Error parsing existing images:', error);
      }
    }

    // Handle file uploads if new files are provided
    if (req.files?.backgroundImage?.[0]) {
      updatedData.backgroundImage = await uploadToCloudinary(req.files.backgroundImage[0]);
    }
    if (req.files?.clientLogo?.[0]) {
      updatedData.clientLogo = await uploadToCloudinary(req.files.clientLogo[0]);
    }
    if (req.files?.portfolioImage?.[0]) {
      updatedData.portfolioImage = await uploadToCloudinary(req.files.portfolioImage[0]);
    }

    // Combine existing images with new uploads
    let newUploadedImages = [];
    if (req.files?.images) {
      newUploadedImages = await Promise.all(req.files.images.map(file => uploadToCloudinary(file)));
    }

    // Combine existing and new images
    updatedData.images = [...existingImagesArray, ...newUploadedImages];

    const updatedProject = await Project.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Failed to update project", error: error.message });
  }
});

// Delete a Project
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete associated images from Cloudinary
    if (deletedProject.backgroundImage) {
      await cloudinary.uploader.destroy(deletedProject.backgroundImage);
    }
    if (deletedProject.clientLogo) {
      await cloudinary.uploader.destroy(deletedProject.clientLogo);
    }
    if (deletedProject.portfolioImage) {
      await cloudinary.uploader.destroy(deletedProject.portfolioImage);
    }
    if (deletedProject.images?.length) {
      await Promise.all(deletedProject.images.map(image => cloudinary.uploader.destroy(image)));
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project", error: error.message });
  }
});

module.exports = router;