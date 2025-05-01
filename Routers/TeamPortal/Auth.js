const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { TaskFlowTeam } = require('../../Models/Task');
const { authenticate, JWT_SECRET } = require('../../Middlewere/Teamportalauth');

// Helper function to create tokens with consistent expiration
const createToken = (payload) => {
  // Set current time when creating token
  const now = Math.floor(Date.now() / 1000);
  console.log('System time when creating token:', new Date().toISOString());
  
  // Calculate expiration - 24 hours from now
  const expiresIn = 24 * 60 * 60; // 24 hours in seconds
  const exp = now + expiresIn;
  
  // Add iat (issued at) and exp (expiration time) explicitly
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: exp
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET);
};

router.get('/me', authenticate, async (req, res) => {
  try {
    // For superadmin, we don't need to query the database
    if (req.user.role === 'superadmin') {
      return res.json({
        user: {
          id: 'superadmin',
          name: 'Super Admin',
          email: 'superadmin@gmail.com',
          role: 'superadmin'
        }
      });
    }
    
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
  console.log('Login attempt with body:', req.body);
  const { email, password } = req.body;
  
  // Hardcoded superadmin check
  if (email === 'superadmin@gmail.com' && password === 'superadmin') {
    const payload = { 
      id: 'superadmin', 
      email: 'superadmin@gmail.com', 
      role: 'superadmin' 
    };
    const token = createToken(payload);
    
    // Log token details for debugging
    const decoded = jwt.decode(token);
    console.log('Created superadmin token:', {
      iat: decoded.iat,
      exp: decoded.exp,
      iatDate: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      timeUntilExpiration: (decoded.exp - Math.floor(Date.now() / 1000)) + ' seconds'
    });
    
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
    
    const payload = { 
      id: taskFlowTeam.id, 
      email: taskFlowTeam.email, 
      role: taskFlowTeam.role 
    };
    const token = createToken(payload);
    
    // Log token details for debugging
    const decoded = jwt.decode(token);
    console.log('Created user token:', {
      iat: decoded.iat,
      exp: decoded.exp,
      iatDate: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      timeUntilExpiration: (decoded.exp - Math.floor(Date.now() / 1000)) + ' seconds'
    });
    
    res.json({
      token,
      user: {
        id: taskFlowTeam.id,
        name: taskFlowTeam.name,
        email: taskFlowTeam.email,
        role: taskFlowTeam.role
      },
    });
    console.log('User logged in successfully:', taskFlowTeam.email)

  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
    console.log('Error in /login route:', error.message);
  }
});

module.exports = router;