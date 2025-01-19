const express = require("express");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Project = require("../Models/ProjectsModel"); // Import Project Model

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dybotqozo", // Replace with your Cloudinary cloud name
  api_key: "176444681733414", // Replace with your Cloudinary API key
  api_secret: "Iio2fclIU0VyxjD1iE_qW2tbxTg", // Replace with your Cloudinary API secret
});

// Cloudinary Storage Configuration for Project Images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "project_images", // Folder for project images in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
  },
});

const upload = multer({ storage }); // Multer configuration with Cloudinary storage

// **Routes for Project Management**

// 1. Add a New Project
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { title, description, technologies, liveUrl, category } = req.body;

    // Store image URL from Cloudinary
    const image = req.file ? req.file.path : "";

    const newProject = new Project({
      title,
      description,
      image, // Cloudinary image URL
      technologies: technologies.split(","), // Split technologies into an array
      liveUrl,
      category,
    });

    await newProject.save();
    res.status(201).json({ message: "Project added successfully", project: newProject });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Failed to add project", error: error.message });
  }
});

// 2. Fetch All Projects or Filter by Category
router.get("/show", async (req, res) => {
  const { category } = req.query;

  try {
    let projects;

    if (category) {
      // Filter projects by category
      projects = await Project.find({ category });
    } else {
      // Fetch all projects
      projects = await Project.find();
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

// 3. Update an Existing Project
router.put("/update/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, description, technologies, liveUrl, category } = req.body;

  try {
    const updatedData = {
      title,
      description,
      technologies: technologies.split(","),
      liveUrl,
      category,
    };

    // If a new image is uploaded, update the image URL
    if (req.file) {
      updatedData.image = req.file.path;
    }

    const updatedProject = await Project.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Run validations
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

// 4. Get Total Project Count
router.get("/count", async (req, res) => {
  try {
    const projectCount = await Project.countDocuments(); // Get count of all projects
    res.json({ count: projectCount });
  } catch (error) {
    res.status(500).json({ error: "Error fetching project count" });
  }
});

// 5. Delete a Project
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project", error: error.message });
  }
});

// Export Router
module.exports = router;
