const express = require('express');
const router = express.Router();
const Message = require('../Models/ClientChats'); // Adjust path as needed
const auth = require('../Middlewere/Message'); // Adjust path as needed

// Get messages for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    // Add some debug logging
    // console.log('User from token:', req.user);

    const messages = await Message.find({
      $or: [
        { senderEmail: req.user.email },
        { recipientEmail: req.user.email }
      ]
    }).sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    // Add some debug logging
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);

    const message = new Message({
      senderEmail: req.user.email,
      recipientEmail: req.body.recipientEmail,
      content: req.body.content
    });

    const newMessage = await message.save();
    
    // Emit socket event if socket.io is set up
    if (req.app.get('io')) {
      req.app.get('io').to(req.body.recipientEmail).emit('newMessage', newMessage);
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;