const express = require("express");
const router = express.Router();
const Project = require("../Models/ClientProjects");
const User = require("../Models/Clients");

// Get all projects
router.get("/show", async (req, res) => {
  const { status } = req.query;  // If you want to filter projects by status

  try {
    let query = {};
    if (status) {
      query.status = status;
    }
    const projects = await Project.find(query);
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});


// Add a new project
router.post("/add", async (req, res) => {
  const { name, clientEmail, status, description } = req.body;

  if (!name || !clientEmail || !description) {
    return res
      .status(400)
      .json({ error: "Name, clientEmail, and description are required" });
  }

  try {
    // Fetch the client details based on email
    const client = await User.findOne({ email: clientEmail });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Assign clientId from the client model
    const clientId = client._id.toString();  // Ensure you're getting the clientId correctly

    // Determine the progress based on status
    let progress = 0;
    if (status === "Completed") {
      progress = 100;
    } else if (status === "Review") {
      progress = 90;
    } else if (status === "On Hold" || status === "Cancelled") {
      progress = 0;  // or set any other logic for these statuses
    } else if (status === "Under Analysis") {
      progress = 50;  // Default progress for these statuses, you can change it
    }

    // Create a new project
    const newProject = new Project({
      name,
      clientEmail,
      clientId,  // Assign the clientId here
      status,
      progress,
      lastUpdate: new Date().toISOString(),
      description,
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) {
    console.error("Project creation error:", err);
    res.status(400).json({ error: err.message || "Failed to create project" });
  }
});

// Update a project
router.put("/:id", async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdate: new Date().toISOString() },
      { new: true }
    );
    res.status(200).json(updatedProject);
  } catch (err) {
    res.status(400).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
