const express = require('express');
const router = express.Router();
const TaskFlowProject = require('../../Models/TaskFlowProjects');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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

// Get all projects
router.get('/', async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      projects = await TaskFlowProject.find();
      console.log(`Admin user ${req.user.email} retrieved all projects`);
    } else {
      // Otherwise only show projects where user is a member
      // Assuming req.user.id contains the user's UUID that matches with the members array
      projects = await TaskFlowProject.find({
        members: req.user.id
      });
      console.log(`User ${req.user.email} retrieved their projects`);
      console.log('User projects:', projects);
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
    const project = await TaskFlowProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role === 'admin' || req.user.role === 'superadmin' || 
        project.members.includes(req.user.id)) {
      return res.json(project);
    } else {
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
      ...(clientProjectId && {
        clientProjectId: new mongoose.Types.ObjectId(clientProjectId)
      })
    });
    
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to check project access
const checkProjectAccess = async (req, res, next) => {
  try {
    const project = await TaskFlowProject.findById(req.params.id);
    
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
    updateFields.clientProjectId = mongoose.Types.ObjectId(clientProjectId);
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

// Middleware to require superadmin permissions
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
  }
  next();
};

// Example of a route that requires superadmin permissions
router.get('/admin/all-projects', requireSuperAdmin, async (req, res) => {
  try {
    const allProjects = await TaskFlowProject.find().sort({ createdAt: -1 });
    res.json(allProjects);
  } catch (err) {
    console.error('Error fetching all projects:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;