const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Import Team Member Model
const TeamMember = require("../Models/TeamMembersModel");

// Initialize Router
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dybotqozo",
  api_key: "176444681733414",
  api_secret: "Iio2fclIU0VyxjD1iE_qW2tbxTg",
});

// Cloudinary Storage Configuration for Team Images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "team_images", // Folder for team member images in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
  },
});

const upload = multer({ storage }); // Multer configuration with Cloudinary storage

// **Routes for Team Member Management**

// 1. Add a New Team Member
router.post("/create", upload.single("image"), async (req, res) => {
  const { name, position, description } = req.body;

  if (!name || !position || !description || !req.file) {
    return res.status(400).json({ error: "All fields are required, including an image." });
  }

  try {
    const newTeamMember = new TeamMember({
      name,
      position,
      description,
      imageUrl: req.file.path, // Cloudinary image URL
    });

    await newTeamMember.save();
    res.status(201).json({ message: "Team member added successfully!", data: newTeamMember });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({ error: "Failed to add team member" });
  }
});

// 2. Fetch All Team Members
router.get("/show", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    res.status(200).json({ success: true, data: teamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// 3. Update an Existing Team Member
router.put("/update/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, position, description } = req.body;

  try {
    const updatedData = {
      name,
      position,
      description,
    };

    if (req.file) {
      updatedData.imageUrl = req.file.path; // Update image URL if a new image is uploaded
    }

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedTeamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.status(200).json({ message: "Team member updated successfully!", data: updatedTeamMember });
  } catch (error) {
    console.error("Error updating team member:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

// 4. Delete a Team Member
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTeamMember = await TeamMember.findByIdAndDelete(id);

    if (!deletedTeamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.status(200).json({ message: "Team member deleted successfully!" });
  } catch (error) {
    console.error("Error deleting team member:", error);
    res.status(500).json({ error: "Failed to delete team member" });
  }
});

// Export Router
module.exports = router;
