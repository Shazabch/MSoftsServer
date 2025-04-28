// projectAccessMiddleware.js
const mongoose = require('mongoose');
const TaskFlowProject = require('../Models/TaskFlowProjects'); // Assuming you have a TaskFlowProject model defined

/**
 * Middleware to control access to projects based on user role and membership
 * Allows admins and superadmins full access
 * Restricts regular users to only projects they are members of
 */
const projectAccessControl = async (req, res, next) => {
  try {
    // Get user info from the token/auth middleware
    const userRole = req.user ? req.user.role : null;
    const userEmail = req.user ? req.user.email : null;
    
    // Check if we have user information
    if (!userRole || !userEmail) {
      console.log('Missing user data. Role:', userRole, 'Email:', userEmail);
      return res.status(401).json({ 
        message: 'Authentication required',
        code: req.tokenExpired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED'
      });
    }
    
    // If user is admin or superadmin, continue without filtering
    if (userRole === 'admin' || userRole === 'superadmin') {
      return next();
    }
    
    // For regular users, only allow access to projects they're a member of
    req.userEmail = userEmail;
    console.log('User email:', userEmail);
    console.log('User role:', userRole);
    return next();
  } catch (err) {
    console.error('Error in project access control:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Middleware to verify project-specific access
 * Used for routes that need to check access to a specific project
 */
const verifyProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    // If admin/superadmin (checked in projectAccessControl), skip this check
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }
    
    // For regular users, check if they're a member of this specific project
    const project = await TaskFlowProject.findOne({ id: projectId });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (!project.members.some(member => member.email === req.user.email)) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }
    
    // User has access to this project
    req.project = project; // Attach project to request for convenience
    return next();
  } catch (err) {
    console.error('Error verifying project access:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  projectAccessControl,
  verifyProjectAccess
};