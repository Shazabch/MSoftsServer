const express = require("express");
const router = express.Router();
const Message = require("../Models/ClientChats");
const auth = require("../Middlewere/Message");
const io = require("../Socket.io/Socket");
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_ROLE = "admin";

router.get("/:clientEmail", auth, async (req, res) => {
  try {
    const { clientEmail } = req.params;
    console.log("Fetching messages for client:", clientEmail);

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

router.post("/", auth, async (req, res) => {
  try {
    const role = req.user.role; // 'client' or 'admin'
    const senderEmail = role === 'admin' ? ADMIN_EMAIL : req.user.email;

    const message = new Message({
      senderEmail: senderEmail,
      recipientEmail: req.body.recipientEmail,
      content: req.body.content,
      role: role,
      timestamp: new Date(),
      read: false,
    });

    const newMessage = await message.save();

    // Emit to recipient's room
    io.getIO().to(req.body.recipientEmail).emit("newMessage", newMessage);
    // If sender is client, also emit to admin room
    if (role === 'client') {
      io.getIO().to(ADMIN_EMAIL).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(400).json({ message: error.message });
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

router.post("/read-all/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find and update message as read
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: { read: true } },
      { new: true } // Return updated message
    );

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Emit event for frontend
    const io = req.app.get("socketio");
    if (io) {
      io.emit("messageRead", messageId);
    }

    res.json({ message: "Message marked as read", updatedMessage });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: error.message });
  }
});
router.post("/read-all", auth, async (req, res) => {
  try {
    const userEmail = req.user.email // Assuming auth middleware adds user to req

    // Update all messages where the user is the recipient
    await Message.updateMany({ recipientEmail: userEmail, read: false }, { $set: { read: true } })

    res.json({ message: "All messages marked as read" })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    res.status(500).json({ message: error.message })
  }
})



module.exports = router;