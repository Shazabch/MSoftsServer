// routes/subAdminRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const SubAdmin = require('../Models/Subadmin'); // Make sure to import your model
const Role=require('../Models/RolesModel');

const router = express.Router();

// GET route for fetching the count of sub-admins
router.get('/count', async (req, res) => {
  try {
    const subAdminCount = await SubAdmin.countDocuments(); // Count the number of sub-admins
    res.status(200).json({ count: subAdminCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sub-admin count', error: err.message });
  }
});
router.get('/active-sessions', async (req, res) => {
  try {
    const activeSessionsCount = await getActiveSessionsCount(); // Logic to get active sessions
    res.status(200).json({ count: activeSessionsCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch active sessions', error: err.message });
  }
});

  // POST route to create a sub-admin
router.post('/create', async (req, res) => {
  const { username, email, password, permissions, role } = req.body;

  try {
    // Check if the email or username already exists in the database
    const existingSubAdmin = await SubAdmin.findOne({ $or: [{ email }, { username }] });
    if (existingSubAdmin) {
      return res.status(400).json({ message: 'Email or Username already exists' });
    }

    // Fetch the role's permissions from the Role model
    const roleData = await Role.findOne({ name: role });
    if (!roleData) {
      return res.status(400).json({ message: 'Role not found' });
    }
    const rolePermissions = roleData.permissions;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new sub-admin
    const newSubAdmin = new SubAdmin({
      username,
      email,
      password: hashedPassword,
      permissions: rolePermissions,  // Store role's permissions
      role, // Store the role
    });

    // Save the sub-admin to the database
    await newSubAdmin.save();

    res.status(201).json({
      message: 'Sub-Admin created successfully!',
      subAdmin: {
        username: newSubAdmin.username,
        email: newSubAdmin.email,
        permissions: newSubAdmin.permissions,
        role: newSubAdmin.role // Include role in response
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create sub-admin', error: err.message });
  }
});

// PUT route to update a sub-admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password, permissions, role } = req.body;

  try {
    // Check if subAdmin exists
    const subAdmin = await SubAdmin.findById(id);
    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub-admin not found' });
    }

    // Fetch the role's permissions from the Role model
    const roleData = await Role.findOne({ name: role });
    if (role && !roleData) {
      return res.status(400).json({ message: 'Role not found' });
    }

    const rolePermissions = roleData ? roleData.permissions : permissions; // Use role's permissions if a role is provided

    // Check if password is provided, hash it before saving
    let updatedPassword = subAdmin.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 12); // Hash the password
    }

    // Update subAdmin data
    subAdmin.username = username || subAdmin.username;
    subAdmin.email = email || subAdmin.email;
    subAdmin.password = updatedPassword;
    subAdmin.permissions = rolePermissions; // Update the permissions based on role
    subAdmin.role = role || subAdmin.role;  // Update the role if provided

    await subAdmin.save(); // Save updated subAdmin

    res.status(200).json({ message: 'Sub-admin updated successfully' });
  } catch (error) {
    console.error('Error updating sub-admin:', error);
    res.status(500).json({ message: 'Failed to update sub-admin' });
  }
});



// Example of the GET route for fetching sub-admins
router.get('/', async (req, res) => {
  try {
    const subAdmins = await SubAdmin.find();
    res.status(200).json(subAdmins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sub-admins', error: err.message });
  }
  // console.log(subAdmins);
});
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
 

  // Check if ID is valid
  if (!id) {
    console.error('No ID provided for deletion');
    return res.status(400).json({ message: 'Sub-admin ID is required' });
  }

  try {
    const subAdmin = await SubAdmin.findByIdAndDelete(id);
    if (!subAdmin) {
      console.error('Sub-admin not found with ID:', id);
      return res.status(404).json({ message: 'Sub-admin not found' });
    }

    res.status(200).json({ message: 'Sub-admin deleted successfully' });
  } catch (err) {
    console.error('Error during deletion:', err);
    res.status(500).json({ message: 'Failed to delete sub-admin', error: err.message });
  }
});


module.exports = router;
