const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const upload = require('../Multer/MulterSetup'); // Import your multer configuration

const TeamMember = require("../Models/TeamMembersModel"); // Ensure the correct model is imported

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Folder to store images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image!"), false);
  }
};

// Route to create a new team member with image upload
router.post('/create', upload.single('image'), async (req, res) => {
  const { name, position, description } = req.body;
  const imageUrl = req.file ? `/Uploads/${req.file.filename}` : null; // Path for the uploaded image

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image is required' });
  }

  try {
    const newTeamMember = new TeamMember({
      name,
      position,
      description,
      imageUrl,
    });

    await newTeamMember.save();
    res.status(201).json({ message: 'Team member added successfully!' });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Get all team members with image URLs
router.get("/show", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    res.status(200).json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Update team member
router.put('/update/:id', upload.single('image'), async (req, res) => { // Ensure you're using 'upload.single' to handle image file uploads
  try {
    const { id } = req.params;
    const { name, position, description } = req.body;
    const imageUrl = req.file ? `/Uploads/${req.file.filename}` : null; // Path for the uploaded image

    const updatedTeamMemberData = {
      name,
      position,
      description,
      imageUrl: imageUrl || req.body.imageUrl, // Only update the imageUrl if a new file was uploaded
    };

    // Find the team member by ID and update
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      id,
      updatedTeamMemberData,
      { new: true } // Return the updated team member data
    );

    if (!updatedTeamMember) {
      return res.status(404).send('Team member not found');
    }

    res.status(200).json(updatedTeamMember); // Send the updated team member data
  } catch (error) {
    console.error("Error updating team member:", error);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/team/delete/:id
router.delete("/delete/:id", async (req, res) => {
 const { id } = req.params; // Get the ID from the request parameters

 try {
   // Find and delete the team member by ID
   const deletedTeamMember = await TeamMember.findByIdAndDelete(id);

   if (!deletedTeamMember) {
     return res.status(404).json({ message: "Team member not found" });
   }

   res.status(200).json({ message: "Team member deleted successfully" });
 } catch (error) {
   console.error("Error deleting team member:", error);
   res.status(500).json({ message: "Internal server error" });
 }
});

module.exports = router;
