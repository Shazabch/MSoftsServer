const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Email
  role: { type: String, default: "user" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;

// Express route handler for sending a message
const express = require("express");
const router = express.Router();
// const Message = require("../Models/UserChatModel");
const authenticateToken = require("../Middlewere/token"); // Make sure the correct path

router.post("/send", authenticateToken, async (req, res) => {
 try {
   const { text } = req.body;

   if (!text) {
     return res.status(400).json({ message: "Message text is required" });
   }

   if (!req.user || !req.user.email) {
     return res.status(400).json({ message: "User email is missing in the token." });
   }

   const message = new Message({
     sender: req.user.email, // Email from the token
     role: req.user.role || "user", // Default role
     text,
   });

   await message.save();
   return res.status(201).json({ message: "Message sent successfully", data: message });
 } catch (error) {
   console.error(error);
   return res.status(500).json({ message: "Internal Server Error" });
 }
});

// Get all messages
router.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }); // Get messages in descending order
    return res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

