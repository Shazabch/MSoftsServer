const express = require('express');
const bcrypt = require('bcryptjs'); // Ensure bcrypt is imported
const jwt = require('jsonwebtoken'); // Import JWT for token generation
const Clients = require('../Models/Clients'); // Adjust the path as needed
const router = express.Router();

// Replace with your secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'msofts';

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find the client by email
    const client = await Clients.findOne({ email });

    if (!client) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if the account is active
    if (client.status !== 'Active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Verify the password
    const isValidPassword = await bcrypt.compare(password, client.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: client._id, email: client.email, role: 'client' }, // Add any payload data you need
      JWT_SECRET,
      { expiresIn: '3d' } // Token expiration time
    );

    // Send success response with the token
    res.json({
      message: 'Login successful',
      token,
      client: {
        id: client._id,
        email: client.email,
        name: client.name, 
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
