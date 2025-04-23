const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { TaskFlowTeam } = require('../../Models/Task');
const { authenticate, requireSuperAdmin } = require('../../Middlewere/Teamportalauth');

// Get all team members
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const teamMembers = await TaskFlowTeam.find({}, 'id name email role');
    res.json(teamMembers);
  } catch (error) {
    console.error('Error in team GET route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new team member
router.post('/new', authenticate, requireSuperAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Validate role
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    // Check if email exists
    const existingMember = await TaskFlowTeam.findOne({ email });
    if (existingMember) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    const newMember = new TaskFlowTeam({
      id: uuidv4(),
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      role
    });
    
    await newMember.save();
    
    res.status(201).json({
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role
    });
  } catch (error) {
    console.error('Error in team POST route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete team member
router.delete('/del/:id', authenticate, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Prevent deleting the last super admin
    const memberToDelete = await TaskFlowTeam.findOne({ id });
    
    if (!memberToDelete) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    if (memberToDelete.role === 'superadmin') {
      const superAdminCount = await TaskFlowTeam.countDocuments({ role: 'superadmin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last super admin' });
      }
    }
    
    await TaskFlowTeam.deleteOne({ id });
    
    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error in team DELETE route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;