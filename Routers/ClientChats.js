const express = require("express");
const router = express.Router();
const Message = require("../Models/ClientChats");
const auth = require("../Middlewere/Message");
const io = require("../Socket.io/Socket");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_ROLE = "admin";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dybotqozo",
  api_key: "176444681733414",
  api_secret: "Iio2fclIU0VyxjD1iE_qW2tbxTg"
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat_attachments",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Update the admin POST route
router.post("/admin", auth, upload.array("attachments", 5), async (req, res) => {
  try {
    const { senderEmail, recipientEmail, content, role } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    // Allow empty content if there are attachments
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Content or attachments are required" });
    }

    const messageData = {
      senderEmail,
      recipientEmail,
      content: content || "", // Use empty string if content is not provided
      role,
      timestamp: new Date(),
      read: false,
    };

    if (req.files && req.files.length > 0) {
      messageData.attachments = req.files.map(file => ({
        url: file.path,
        filename: file.originalname
      }));
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Emit message to specific client
    io.getIO().to(recipientEmail).emit("newMessage", newMessage);
    // Also emit to admin room
    io.getIO().to(ADMIN_EMAIL).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update the general POST route
router.post("/", upload.array("attachments"), async (req, res) => {
  try {
    const { senderEmail, recipientEmail, content, role } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    // Allow empty content if there are attachments
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Content or attachments are required" });
    }

    const messageData = {
      senderEmail,
      recipientEmail,
      content: content || "", // Use empty string if content is not provided
      role,
      timestamp: new Date(),
      read: false,
    };

    if (req.files && req.files.length > 0) {
      messageData.attachments = req.files.map(file => ({
        url: file.path,
        filename: file.originalname
      }));
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Emit message to specific client
    io.getIO().to(recipientEmail).emit("newMessage", newMessage);
    // Also emit to admin room
    io.getIO().to(ADMIN_EMAIL).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/unread-counts", auth, async (req, res) => {
  try {
    const unreadMessages = await Message.aggregate([
      {
        $match: {
          recipientEmail: ADMIN_EMAIL,
          read: false
        }
      },
      {
        $group: {
          _id: "$senderEmail",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadCounts = {};
    unreadMessages.forEach(({ _id, count }) => {
      unreadCounts[_id] = count;
    });

    res.json(unreadCounts);
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/read-all-admin", auth, async (req, res) => {
  try {
    const { clientEmail } = req.body;

    // Update messages FROM client TO admin
    const updatedMessages = await Message.updateMany(
      { 
        senderEmail: clientEmail,
        recipientEmail: ADMIN_EMAIL,
        read: false 
      },
      { $set: { read: true } }
    );

    // Emit event for frontend
    const io = req.app.get("socketio");
    if (io) {
      io.emit("messagesRead", { clientEmail, updatedBy: "admin" });
    }

    res.json({ message: "All messages marked as read", updatedMessages });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/read-all", auth, async (req, res) => {
  try {
    const userEmail = req.user.email; // Assuming auth middleware adds user to req

    // Update messages FROM admin TO client
    const updatedMessages = await Message.updateMany(
      { 
        senderEmail: ADMIN_EMAIL,
        recipientEmail: userEmail,
        read: false 
      },
      { $set: { read: true } }
    );

    // Emit event for frontend with context
    const io = req.app.get("socketio");
    if (io) {
      io.emit("messagesRead", { clientEmail: userEmail, updatedBy: "client" });
    }

    res.json({ message: "All messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:clientEmail", auth, async (req, res) => {
  try {
    const { clientEmail } = req.params;

    const messages = await Message.find({
      $or: [
        { senderEmail: clientEmail, recipientEmail: ADMIN_EMAIL },
        { senderEmail: ADMIN_EMAIL, recipientEmail: clientEmail },
      ],
    })
      .sort({ timestamp: 1 })
      .select("senderEmail recipientEmail content timestamp read role attachments");

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderEmail: ADMIN_EMAIL }, { recipientEmail: ADMIN_EMAIL }],
    })
      .sort({ timestamp: 1 })
      .select("senderEmail recipientEmail content timestamp read role attachments");

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;