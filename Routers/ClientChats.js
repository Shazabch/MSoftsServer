const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Message Schema
const messageSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, required: true },
  messages: [
    {
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Message = mongoose.model('Message', messageSchema);

// GET Messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ 'messages.timestamp': 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// POST Message
router.post('/messages', async (req, res) => {
  const { sender, role, message, email } = req.body; // Added email to destructure from body
  

  // Attempt to save the message
  try {
    // Check if the email already exists in the database, if yes, append the new message
    let messageDoc = await Message.findOne({ email });

    if (messageDoc) {
      // If the message document exists, add the new message to the messages array
      messageDoc.messages.push({
        content: message, 
        timestamp: new Date(),
      });
      await messageDoc.save();
    } else {
      // If the email is not found, create a new message document
      messageDoc = new Message({
        email,
        role,
        messages: [{ content: message, timestamp: new Date() }],
      });
      await messageDoc.save();
    }

    // Send back the saved message
    res.status(201).json(messageDoc);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
