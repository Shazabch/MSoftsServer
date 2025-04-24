const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { TaskFlowTeam } = require('../../Models/Task');
const { authenticate, JWT_SECRET } = require('../../Middlewere/Teamportalauth');

router.get('/me', authenticate, async (req, res) => {
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const taskFlowTeam = await TaskFlowTeam.findOne({ id: req.user.id });
    
    if (!taskFlowTeam) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    res.json({
      user: {
        id: taskFlowTeam.id,
        name: taskFlowTeam.name,
        email: taskFlowTeam.email,
        role: taskFlowTeam.role
      }
    });
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Hardcoded superadmin check
  if (email === 'superadmin@gmail.com' && password === 'superadmin') {
    const token = jwt.sign(
      { id: 'superadmin', email: 'superadmin@gmail.com', role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '24h' } // Explicitly set to 24 hours (1 day)
    );
    
    return res.json({
      token,
      user: {
        id: 'superadmin',
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        role: 'superadmin'
      }
    });
  }
  
  // Regular user authentication flow
  try {
    // Check if TaskFlowTeam exists before using it
    if (!TaskFlowTeam) {
      console.error('TaskFlowTeam model is undefined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const taskFlowTeam = await TaskFlowTeam.findOne({ email });
    
    if (!taskFlowTeam || !bcrypt.compareSync(password, taskFlowTeam.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: taskFlowTeam.id, email: taskFlowTeam.email, role: taskFlowTeam.role },
      JWT_SECRET,
      { expiresIn: '24h' } // Explicitly set to 24 hours (1 day)
    );
    
    res.json({
      token,
      user: {
        id: taskFlowTeam.id,
        name: taskFlowTeam.name,
        email: taskFlowTeam.email,
        role: taskFlowTeam.role
      }
    });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;