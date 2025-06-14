const express = require('express');
const router = express.Router();
const TaskFlowProject = require('../../Models/TaskFlowProjects');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { TaskFlowTeam } = require('../../Models/Task'); // Import your TaskFlowTeam model

const JWT_SECRET = process.env.JWT_SECRET || 'msofts';

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Apply authentication middleware to all routes in this router
router.use(authenticate);
router.get('/:projectId/members', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`Attempting to fetch members for project with ID: ${projectId}`);
    
    // Try to find the project without assuming ID format
    let project;
    
    // First try with MongoDB ObjectId (if valid)
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      project = await TaskFlowProject.findById(projectId);
    }
    
    // If not found with ObjectId, try with the id field (UUID)
    if (!project) {
      project = await TaskFlowProject.findOne({ id: projectId });
    }
    
    if (!project) {
      console.log(`Project not found with ID: ${projectId}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role === 'admin' || req.user.role === 'superadmin' || 
        project.members.includes(req.user.id)) {
      
      // Option 1: Exclusion approach - exclude only the password field
      const memberDetails = await TaskFlowTeam.find(
        { id: { $in: project.members } },
        { password: 0 }  // Exclude only the password field
      );
        return res.json(memberDetails);
    } else {
      console.log(`Access denied for user ${req.user.id} to project ${project._id}`);
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    console.error('Error fetching project members:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get all projects
router.get('/', async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      projects = await TaskFlowProject.find();
    } else {
      projects = await TaskFlowProject.find({
        members: req.user.id 
      });
    }
    
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Attempting to fetch project with ID: ${req.params.id}`);
    
    // Try to find the project without assuming ID format
    let project;
    
    // First try with MongoDB ObjectId (if valid)
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      project = await TaskFlowProject.findById(req.params.id);
    }
    
    // If not found with ObjectId, try with the id field (UUID)
    if (!project) {
      project = await TaskFlowProject.findOne({ id: req.params.id });
    }
    
    if (!project) {
      console.log(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role === 'admin' || req.user.role === 'superadmin' || 
        project.members.includes(req.user.id)) {
      return res.json(project);
    } else {
      console.log(`Access denied for user ${req.user.id} to project ${project._id}`);
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    console.error('Error fetching project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  const { name, description, status, members, clientProjectId } = req.body;
  
  try {
    
    let projectMembers = members || [];
    // Add current user as a member if not already included
    if (req.user.id && !projectMembers.includes(req.user.id)) {
      projectMembers.push(req.user.id);
    }
    
    const newProject = new TaskFlowProject({
      name,
      description,
      status,
      members: projectMembers,
      id: require('uuid').v4(), // Generate a UUID if not provided
      ...(clientProjectId && {
        clientProjectId: mongoose.Types.ObjectId.isValid(clientProjectId) 
          ? new mongoose.Types.ObjectId(clientProjectId) 
          : clientProjectId
      })
    });
    
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to check project access with flexible ID handling
const checkProjectAccess = async (req, res, next) => {
  try {
    console.log(`Checking access for project with ID: ${req.params.id}`);
    
    // Try to find the project without assuming ID format
    let project;
    
    // First try with MongoDB ObjectId (if valid)
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      project = await TaskFlowProject.findById(req.params.id);
    }
    
    // If not found with ObjectId, try with the id field (UUID)
    if (!project) {
      project = await TaskFlowProject.findOne({ id: req.params.id });
    }
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Admin/superadmin can access all projects
    // Regular users can only access projects they're members of
    if (req.user.role === 'admin' || req.user.role === 'superadmin' || 
        project.members.includes(req.user.id)) {
      req.project = project;
      next();
    } else {
      console.log(`Access denied for user ${req.user.id} to project ${project._id}`);
      res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    console.error('Error in project access middleware:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project
router.put('/:id', checkProjectAccess, async (req, res) => {
  const { name, description, status, members, clientProjectId } = req.body;
  const updateFields = {};
  
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;
  if (status) updateFields.status = status;
  if (members) updateFields.members = members;
  if (clientProjectId) {
    updateFields.clientProjectId = mongoose.Types.ObjectId.isValid(clientProjectId)
      ? new mongoose.Types.ObjectId(clientProjectId)
      : clientProjectId;
  } else if (clientProjectId === '') {
    // If empty string is passed, remove the clientProjectId
    updateFields.clientProjectId = undefined;
  }
  
  try {
    // Project already verified and attached to req by middleware
    let project = req.project;
    
    // Update project fields
    Object.keys(updateFields).forEach(key => {
      project[key] = updateFields[key];
    });
    
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/:id', checkProjectAccess, async (req, res) => {
  try {
    // Project already verified and attached to req by middleware
    await req.project.deleteOne();
    res.json({ message: 'Project removed' });
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// Add this route to your existing project.js file

router.get('/name/:id', async (req, res) => {
  try {
    console.log(`Attempting to fetch project name with ID: ${req.params.id}`);
    
    // Try to find the project without assuming ID format
    let project;
    
    // First try with MongoDB ObjectId (if valid)
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      project = await TaskFlowProject.findById(req.params.id);
    }
    
    // If not found with ObjectId, try with the id field (UUID)
    if (!project) {
      project = await TaskFlowProject.findOne({ id: req.params.id });
    }
    
    if (!project) {
      console.log(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Return just the project name and id
    return res.json({ 
      id: project._id || project.id,
      name: project.name 
    });
  } catch (err) {
    console.error('Error fetching project name:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;