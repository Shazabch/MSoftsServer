const express = require("express");
const router = express.Router();
const Role = require("../Models/RolesModel"); // Assuming you have a Role model

// Get all roles
router.get("/", async (req, res) => {
  try {
    const roles = await Role.find(); // Retrieve all roles
    res.status(200).json(roles); // Return roles as response
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch roles.", error });
  }
});

// Create a new role
router.post("/", async (req, res) => {
  const { name, permissions, description } = req.body;

  try {
    // Check if the role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists." });
    }

    // Create the new role
    const role = new Role({
      name,
      permissions,
      description,
    });
    await role.save();

    res.status(201).json({ message: "Role created successfully.", role });
  } catch (error) {
    res.status(500).json({ message: "Failed to create role.", error });
  }
});

// Update a role
router.put("/:id", async (req, res) => {
  const roleId = req.params.id;
  const { name, permissions, description } = req.body;

  try {
    // Find the role by ID and update it
    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      { name, permissions, description },
      { new: true } // Return the updated role
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role updated successfully.", updatedRole });
  } catch (error) {
    res.status(500).json({ message: "Failed to update role.", error });
  }
});

// Delete a role
router.delete("/:id", async (req, res) => {
  const roleId = req.params.id;

  try {
    // Find the role by ID and delete it
    const deletedRole = await Role.findByIdAndDelete(roleId);

    if (!deletedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete role.", error });
  }
});

module.exports = router;
