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
      liveurl
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
      liveUrl: liveurl
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
  const { category } = req.query;

  try {
    let projects;
    if (category && category !== 'all') {
      projects = await Project.find({ category: category });
    } else {
      projects = await Project.find();
    }
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

// Update an Existing Project
router.put("/update/:id", upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'clientLogo', maxCount: 1 },
  { name: 'portfolioImage', maxCount: 1 }, // Added portfolio image
  { name: 'images', maxCount: 10 }
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
      liveUrl
    } = req.body;

    // Generate new slug if title changed
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const updatedData = {
      title,
      subtitle,
      slug,
      category: JSON.parse(category),
      description,
      client,
      technologies: JSON.parse(technologies),
      features: features ? JSON.parse(features) : [],
      challenge,
      solution,
      results,
      testimonial,
      regions: regions ? JSON.parse(regions) : [],
      liveUrl
    };

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
    if (req.files?.images) {
      updatedData.images = await Promise.all(req.files.images.map(file => uploadToCloudinary(file)));
    }

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