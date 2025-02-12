const express = require('express');
const Message = require('../Models/ClientChats');

const router = express.Router();

// Get all messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Post a new message
router.post('/messages', async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();
    req.io.emit('newMessage', message); // Socket.IO emit from request
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error saving message' });
  }
});

module.exports = router;
