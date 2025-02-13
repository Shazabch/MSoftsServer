const express = require("express");
const router = express.Router();
const Message = require("../Models/ClientChats");
const auth = require("../Middlewere/Message");
const io = require("../Socket.io/Socket"); // Ensure you have socket.io instance


// Static admin email
// Static admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_ROLE = "admin";

// Get messages for a specific client
router.get("/:clientEmail", auth, async (req, res) => {
  try {
    const { clientEmail } = req.params;
    console.log("Fetching messages for client:", clientEmail);
    console.log("Admin email:", ADMIN_EMAIL); // Static admin email

    const messages = await Message.find({
      $or: [
        { senderEmail: clientEmail, recipientEmail: ADMIN_EMAIL },
        { senderEmail: ADMIN_EMAIL, recipientEmail: clientEmail },
      ],
    }).sort({ timestamp: 1 });

    console.log("Messages found:", messages.length);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all messages for the current user
router.get("/", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderEmail: ADMIN_EMAIL }, { recipientEmail: ADMIN_EMAIL }],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/admin", async (req, res) => {
  try {
    const { recipientEmail, content } = req.body;

    if (!recipientEmail || !content) {
      return res.status(400).json({ message: "Recipient and content are required" });
    }

    const newMessage = new Message({
      senderEmail: ADMIN_EMAIL,
      recipientEmail,
      content,
      role: ADMIN_ROLE,
      timestamp: new Date(),
      read: false,
    });

    await newMessage.save();

    // Emit message to client via socket
    io.getIO().emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Send a new message
router.post("/", auth, async (req, res) => {
  try {
    const role = req.user.role; // 'client' or 'admin'

    // Determine sender email based on role
    const senderEmail = role === 'admin' ? ADMIN_EMAIL : req.user.email; // Static email for admin, token email for client

    const message = new Message({
      senderEmail: senderEmail, // Use the dynamic email for client, static for admin
      recipientEmail: req.body.recipientEmail,
      content: req.body.content,
      role: role,
    });

    const newMessage = await message.save();

    // Emit socket event if socket.io is set up
    if (req.app.get("io")) {
      req.app.get("io").to(req.body.recipientEmail).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
