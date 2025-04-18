const express = require("express");
const router = express.Router();
const Project = require("../Models/ClientProjects");
const User = require("../Models/Clients");
const auth = require("../Middlewere/ClientAuth");

// Get all projects for a client
router.get("/clientshow",auth,  async (req, res) => {
  try {
    const projects = await Project.find({ clientId: req.user.id });
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects", details: err.message });
  }
});

// Get all projects
router.get("/show", async (req, res) => {
  const { status } = req.query;
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
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Add a new project
router.post("/add", async (req, res) => {
  console.log("Received data:", req.body);

  const { name, clientEmail, status, description, features, budget, deadline } = req.body;

  if (!name || !clientEmail || !description || !features || !budget || !deadline) {
    return res
      .status(400)
      .json({ error: "Name, clientEmail, description, features, budget, and deadline are required" });
  }

  try {
    // Fetch the client details based on email
    const client = await User.findOne({ email: clientEmail });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Assign clientId from the client model
    const clientId = client._id.toString();

    // Calculate days remaining
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const timeDiff = deadlineDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Determine the progress based on status
    let progress = 0;
    if (status === "Completed") {
      progress = 100;
    } else if (status === "Review") {
      progress = 90;
    } else if (status === "Starting Project") {
      progress = 10;
    } else if (status === "On Hold" || status === "Cancelled") {
      progress = 0;
    } else if (status === "Under Analysis") {
      progress = 50;
    }

    // Create a new project
    const newProject = new Project({
      name,
      clientEmail,
      clientId,
      status,
      progress,
      lastUpdate: new Date().toISOString(),
      description,
      features,
      budget,
      deadline,
      daysRemaining,
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) {
    console.error("Project creation error:", err);
    res.status(400).json({ error: err.message || "Failed to create project" });
  }
});

// Update a project - Fixed the route path by removing "update" from the beginning
router.put("/update/:id", async (req, res) => {
  const { name, clientEmail, status, description, features, budget, deadline } = req.body;

  try {
    // Calculate days remaining if the deadline has changed
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const timeDiff = deadlineDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name,
        clientEmail,
        status,
        description,
        features,
        budget,
        deadline,
        daysRemaining,
        lastUpdate: new Date().toISOString(),
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json(updatedProject);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;