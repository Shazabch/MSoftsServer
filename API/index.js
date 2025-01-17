const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import your routes
const authRoutes = require('../Routers/Auth');
const subAdminRoutes = require('../Routers/SubAdmin');
// ... other imports

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../Multer/Uploads")));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subadmins', subAdminRoutes);
// ... other routes

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Export the handler for Vercel
module.exports = app;
