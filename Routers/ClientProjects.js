const express = require("express");
const router = express.Router();
const Project = require("../Models/ClientProjects");
const User = require("../Models/Clients");
const Notification = require('../Models/ClientNotifications');
const auth = require("../Middlewere/ClientAuth");

// Enhanced notification creation with better debugging
const createNotification = async (userEmail, title, message, type = 'info') => {
  console.log(`NOTIFICATION ATTEMPT: Creating notification for ${userEmail}: ${title}`);
  try {
    // Verify Notification model exists and is properly imported
    console.log("Notification model type:", typeof Notification);
    console.log("Notification model:", Object.keys(Notification).length > 0 ? "Valid" : "Invalid");
    
    const notification = new Notification({
      userEmail, 
      title,
      message,
      type,
      read: false
    });
    
    console.log("Notification object created:", notification);
    
    const saved = await notification.save();
    console.log('SUCCESS: Notification created:', saved);
    return saved;
  } catch (error) {
    console.error('ERROR: Creating notification failed:', error);
    console.log('Error details:', error.message);
    console.log('Error stack:', error.stack);
    return null;
  }
};

// Get all projects for a client
router.get("/clientshow", auth, async (req, res) => {
  console.log(`GET /api/projects/clientshow - Fetching projects for client ID: ${req.user.id}`);
  try {
    const projects = await Project.find({ clientId: req.user.id });
    console.log(`Found ${projects.length} projects for client ${req.user.id}`);
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects", details: err.message });
  }
});

// Get all projects
router.get("/show", async (req, res) => {
  const { status } = req.query;
  console.log(`GET /api/projects/show - Fetching all projects${status ? ` with status: ${status}` : ''}`);
  try {
    let query = {};
    if (status) {
      query.status = status;
    }
    const projects = await Project.find(query);
    console.log(`Found ${projects.length} projects${status ? ` with status: ${status}` : ''}`);
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching all projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/:id", async (req, res) => {
  console.log(`GET /api/projects/${req.params.id} - Fetching project details`);
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      console.log(`Project with ID ${req.params.id} not found`);
      return res.status(404).json({ message: "Project not found" });
    }

    console.log(`Found project: ${project.name}`);
    res.json(project);
  } catch (error) {
    console.error(`Error fetching project ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Add a new project
router.post("/add", async (req, res) => {
  console.log("POST /api/projects/add - Creating new project");
  console.log("Received data:", req.body);

  const { name, clientEmail, status, description, features, budget, deadline } = req.body;

  if (!name || !clientEmail || !description || !features || !budget || !deadline) {
    console.log("Missing required fields in project creation request");
    return res
      .status(400)
      .json({ error: "Name, clientEmail, description, features, budget, and deadline are required" });
  }

  try {
    // Fetch the client details based on email
    console.log(`Looking up client with email: ${clientEmail}`);
    const client = await User.findOne({ email: clientEmail });
    if (!client) {
      console.log(`Client with email ${clientEmail} not found`);
      return res.status(404).json({ error: "Client not found" });
    }
    console.log(`Found client: ${client._id}`);

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

    const savedProject = await newProject.save();
    console.log(`Project created successfully with ID: ${savedProject._id}`);
    
    // Create notification for new project
    console.log(`Creating notification for client: ${clientEmail}`);
    try {
      const notificationResult = await createNotification(
        clientEmail,
        'New Project Created',
        `A new project "${name}" has been created with a deadline of ${new Date(deadline).toLocaleDateString()}`,
        'info'
      );
      console.log("Notification creation result:", notificationResult);
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(201).json(savedProject);
  } catch (err) {
    console.error("Project creation error:", err);
    res.status(400).json({ error: err.message || "Failed to create project" });
  }
});

// Update a project
router.put("/update/:id", async (req, res) => {
  console.log(`PUT /api/projects/update/${req.params.id} - Updating project`);
  console.log("Update data:", req.body);
  
  const { name, clientEmail, status, description, features, budget, deadline } = req.body;

  try {
    // Fetch the original project to compare changes
    const originalProject = await Project.findById(req.params.id);
    if (!originalProject) {
      console.log(`Project with ID ${req.params.id} not found`);
      return res.status(404).json({ error: "Project not found" });
    }
    
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

    console.log(`Project updated successfully: ${updatedProject._id}`);

    // Create notification for project update
    if (clientEmail) {
      // Check what changed to customize the notification
      let changes = [];
      if (originalProject.status !== status) {
        changes.push(`status changed to "${status}"`);
      }
      if (originalProject.deadline !== deadline) {
        changes.push(`deadline updated to ${new Date(deadline).toLocaleDateString()}`);
      }
      if (originalProject.budget !== budget) {
        changes.push(`budget updated to ${budget}`);
      }
      
      const message = changes.length > 0 
        ? `Your project "${name}" has been updated: ${changes.join(', ')}`
        : `Your project "${name}" has been updated`;
      
      console.log(`Creating notification for client: ${clientEmail}`);
      try {
        const notificationResult = await createNotification(
          clientEmail,
          'Project Updated',
          message,
          'info'
        );
        console.log("Notification creation result:", notificationResult);
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    res.status(200).json(updatedProject);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/delete/:id", async (req, res) => {
  console.log(`DELETE /api/projects/delete/${req.params.id} - Deleting project`);
  try {
    const projectToDelete = await Project.findById(req.params.id);
    if (!projectToDelete) {
      console.log(`Project with ID ${req.params.id} not found`);
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Store project info before deletion for notification
    const { name, clientEmail } = projectToDelete;
    
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    console.log(`Project deleted successfully: ${deletedProject._id}`);
    
    // Create notification for project deletion
    if (clientEmail) {
      console.log(`Creating notification for client: ${clientEmail}`);
      try {
        const notificationResult = await createNotification(
          clientEmail,
          'Project Deleted',
          `The project "${name}" has been removed from your account`,
          'warning'
        );
        console.log("Notification creation result:", notificationResult);
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }
    
    res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Add this test route to diagnose notification issues
router.post("/test-notification", async (req, res) => {
  console.log("POST /api/projects/test-notification - Testing notification creation");
  try {
    const { email, title, message, type } = req.body;
    
    if (!email || !title || !message) {
      return res.status(400).json({ message: "Email, title, and message are required" });
    }
    
    console.log(`Testing notification creation for ${email}`);
    const notification = await createNotification(
      email,
      title,
      message,
      type || 'info'
    );
    
    if (notification) {
      console.log("Test notification created successfully");
      res.status(201).json({ success: true, notification });
    } else {
      console.log("Failed to create test notification");
      res.status(500).json({ success: false, message: "Failed to create notification" });
    }
  } catch (error) {
    console.error("Error in test notification route:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

module.exports = router;