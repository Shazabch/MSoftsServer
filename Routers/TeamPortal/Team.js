const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { TaskFlowTeam } = require('../../Models/Task');
const { authenticate, requireSuperAdmin } = require('../../Middlewere/Teamportalauth');

// Get all team members
router.get('/', authenticate, async (req, res) => {
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Return all necessary fields including email (which we now use for task assignment)
    const teamMembers = await TaskFlowTeam.find({}, 'id name email role');
    res.json(teamMembers);
  } catch (error) {
    console.error('Error in team GET route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new team member
router.post('/new', authenticate, async (req, res) => {
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

router.put('/update/:id', authenticate, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const member = await TaskFlowTeam.findOne({ id });
    
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // If email is changed, check if new email already exists
    if (email && email !== member.email) {
      const existingMember = await TaskFlowTeam.findOne({ email });
      if (existingMember) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update fields if provided
    if (name) member.name = name;
    if (email) member.email = email;
    if (role) {
      // Validate role
      const allowedRoles = ['user', 'admin', 'superadmin'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      
      // Prevent removing the last super admin
      if (member.role === 'superadmin' && role !== 'superadmin') {
        const superAdminCount = await TaskFlowTeam.countDocuments({ role: 'superadmin' });
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: 'Cannot change role of the last super admin' });
        }
      }
      
      member.role = role;
    }
    if (password) {
      member.password = bcrypt.hashSync(password, 10);
    }
    
    await member.save();
    
    res.json({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role
    });
  } catch (error) {
    console.error('Error in team UPDATE route:', error);
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