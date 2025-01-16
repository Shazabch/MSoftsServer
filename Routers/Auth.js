const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const SubAdmin = require('../Models/Subadmin');
const session = require('express-session');

const router = express.Router();

// Setup session middleware
router.use(session({
  secret: 'msofts',  // Replace this with a strong secret key in production
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }  // In production, set `secure: true` for HTTPS
}));

// Register route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Login request body:', req.body);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backend - Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const subAdmin = await SubAdmin.findOne({ email });
    if (!subAdmin) {
      return res.status(404).json({ error: 'SubAdmin not found' });
    }

    const isMatch = await bcrypt.compare(password, subAdmin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({
      id: subAdmin._id.toString(),
      email: subAdmin.email,
      username: subAdmin.username || "Default Username",  // Provide a fallback if username is missing
      permissions: subAdmin.permissions || [],  // Provide an empty array if permissions are missing
      isAdmin: true,
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});







// Logout route (clear session)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Route to get the logged-in user's profile data
router.get('/profile', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

module.exports = router;
