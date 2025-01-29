const express = require("express");
const Client = require("../Models/Clients");
const router = express.Router();

// Get all clients
router.get("/show", async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve clients." });
  }
});

// Create a new client
router.post("/create", async (req, res) => {
  const {
    name,
    email,
    phone,
    company,
   address,
  } = req.body;

  const newClient = new Client({
    name,
    email,
    phone,
    company,
   address,
  });

  try {
    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (err) {
    res.status(400).json({ message: "Failed to create client." });
  }
});

// Update a client by ID
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedClient = await Client.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.json(updatedClient);
  } catch (err) {
    res.status(400).json({ message: "Failed to update client." });
  }
});

// Delete a client by ID
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Client.findByIdAndDelete(id);
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete client." });
  }
});

module.exports = router;
