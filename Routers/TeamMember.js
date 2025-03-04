const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const TeamMember = require("../Models/TeamMembersModel");
const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: "dybotqozo",
  api_key: "176444681733414",
  api_secret: "Iio2fclIU0VyxjD1iE_qW2tbxTg",
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "team_images", 
    allowed_formats: ["jpg", "jpeg", "png"], 
  },
});

// Multer upload middleware
const upload = multer({ storage }); 

// Create team member route
router.post("/create", upload.single("image"), async (req, res) => {
  const { name, position, description } = req.body;
  // Validate required fields
  if (!name || !position || !description) {
    return res.status(400).json({ error: "Name, position, and description are required" });
  }

  try {
    // Prepare team member data
    const teamMemberData = {
      name,
      position,
      description,
      imageUrl: req.file ? req.file.path : null, // Use Cloudinary URL if image uploaded
    };

    // Create and save team member
    const newTeamMember = new TeamMember(teamMemberData);
    await newTeamMember.save();

    res.status(201).json({ 
      message: "Team member added successfully!", 
      data: newTeamMember 
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({ 
      error: "Failed to add team member",
      details: error.message 
    });
  }
});

// Update team member route
router.put("/update/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, position, description, imageDeleted } = req.body;

  try {
    // Find existing team member
    const existingTeamMember = await TeamMember.findById(id);

    if (!existingTeamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    // Prepare update data
    const updateData = {};

    // Update text fields if provided
    if (name) updateData.name = name;
    if (position) updateData.position = position;
    if (description) updateData.description = description;

    // Handle image update
    if (req.file) {
      // New image uploaded - use Cloudinary URL
      updateData.imageUrl = req.file.path;
    } else if (imageDeleted === "true") {
      // Explicitly delete image
      updateData.imageUrl = null;
    }

    // If no update fields, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    // Update the team member
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: "Team member updated successfully!", 
      data: updatedTeamMember 
    });

  } catch (error) {
    console.error("Error updating team member:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

// Other existing routes remain the same
router.get("/show", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    res.status(200).json({ success: true, data: teamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

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

module.exports = router;