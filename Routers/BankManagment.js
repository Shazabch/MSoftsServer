const express = require("express");
const router = express.Router();
const Bank = require("../Models/Banks");

// Create a new bank
router.post("/", async (req, res) => {
  try {
    const { bankName, holderName, ibanNumber } = req.body;
    const newBank = new Bank({ bankName, holderName, ibanNumber });
    await newBank.save();
    res.status(201).json(newBank);
  } catch (error) {
    res.status(500).json({ message: "Error adding bank" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({ message: "Bank not found" });
    }

    res.json(bank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get all banks
router.get("/", async (req, res) => {
  try {
    const banks = await Bank.find();
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Get a single bank by ID
router.get("/:id", async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: "Bank not found" });
    res.json(bank);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Update bank details
router.put("/:id", async (req, res) => {
  try {
    const updatedBank = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBank);
  } catch (error) {
    res.status(500).json({ message: "Error updating bank" });
  }
});

// Delete a bank
router.delete("/:id", async (req, res) => {
  try {
    await Bank.findByIdAndDelete(req.params.id);
    res.json({ message: "Bank deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bank" });
  }
});
module.exports = router;