const express = require("express")
const router = express.Router()
const Chat = require("../Models/Chat")

// Get chat history for a specific client
router.get("/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId
    
    // Find chat specifically for this client
    const chat = await Chat.findOne({ clientId })
    
    if (!chat) {
      // If no chat exists, return empty array instead of 404
      return res.json([])
    }
    
    // Return messages for this specific client only
    res.json(chat.messages)
  } catch (error) {
    console.error("Error fetching chat:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Send a new message
router.post("/send", async (req, res) => {
  try {
    const { clientId, content, isAdmin } = req.body

    if (!clientId || !content) {
      return res.status(400).json({ message: "ClientId and content are required" })
    }

    // Find or create chat for this specific client
    let chat = await Chat.findOne({ clientId })

    if (!chat) {
      chat = new Chat({ 
        clientId,
        messages: []
      })
    }

    const newMessage = {
      senderId: isAdmin ? "admin" : clientId,
      content,
      timestamp: new Date(),
      isAdmin,
      clientId // Add clientId to the message
    }

    chat.messages.push(newMessage)
    await chat.save()

    res.status(201).json(newMessage)
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router