const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const SubAdmin = require('../Models/Subadmin');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // For session storage in MongoDB
const jwt = require('jsonwebtoken');

const router = express.Router();

// MongoDB connection string
const MONGO_URI = 'mongodb+srv://majesticsofts:GbyEH9AXMi8QT4oI@majesticsofts.l5j37.mongodb.net/MajesticSofts?retryWrites=true&w=majority'; // Replace with your MongoDB URI

// Setup session middleware with MongoDB storage
router.use(session({
  secret: 'msofts', // Replace this with a strong secret key in production
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }), // Store sessions in MongoDB
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // In production, set `secure: true` for HTTPS
}));

// JWT Secret Key
const JWT_SECRET = 'msofts'; // Change this to a more secure value

// Register route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

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

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // SuperAdmin login
    if (email === 'superadmin@gmail.com' && password === 'superadmin') {
      const token = jwt.sign(
        { email: 'superadmin@gmail.com', username: 'superadmin', permissions: ['allPermissions'], isAdmin: true },
        JWT_SECRET,
        { expiresIn: '1d' } // Token valid for 1 day
      );

      req.session.user = { email: 'superadmin@gmail.com', username: 'superadmin', permissions: ['allPermissions'], isAdmin: true };
      return res.status(200).json({
        email: 'superadmin@gmail.com',
        username: 'superadmin',
        permissions: ['allPermissions'],
        isAdmin: true,
        token,
      });
    }

    // SubAdmin login
    const subAdmin = await SubAdmin.findOne({ email });
    if (!subAdmin) {
      return res.status(404).json({ error: 'SubAdmin not found' });
    }

    const isMatch = await bcrypt.compare(password, subAdmin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: subAdmin._id.toString(), email: subAdmin.email, username: subAdmin.username, permissions: subAdmin.permissions, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '1d' } // Token valid for 1 day
    );

    req.session.user = { id: subAdmin._id.toString(), email: subAdmin.email, username: subAdmin.username, permissions: subAdmin.permissions, isAdmin: true };
    res.status(200).json({
      id: subAdmin._id.toString(),
      email: subAdmin.email,
      username: subAdmin.username || 'Default Username',
      permissions: subAdmin.permissions || [],
      isAdmin: true,
      token,
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

// Middleware to protect routes using JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

  if (!token) {
    return res.status(403).json({ error: 'Access denied, token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded; // Add decoded user data to the request object
    next();
  });
};

// Example protected route using JWT
router.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
