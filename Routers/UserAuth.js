const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Register
router.post('/register', async (req, res) => {
 try {
   const { name, email, username, password } = req.body;

   if (!username) {
     return res.status(400).json({ message: 'Username is required' });
   }

   let user = await User.findOne({ email });
   if (user) {
     return res.status(400).json({ message: 'User already exists' });
   }

   user = new User({
     name,
     email,
     username, // Include username here
     password,
   });

   await user.save();

   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
     expiresIn: '7d',
   });

   res.status(201).json({
     token,
     user: {
       id: user._id,
       name: user.name,
       email: user.email,
       username: user.username,
       role: user.role,
     },
   });
 } catch (error) {
   res.status(500).json({ message: error.message });
 }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me',  async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;