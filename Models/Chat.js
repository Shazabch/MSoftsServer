const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true, // Ensure each client has a unique chat thread
      index: true, // Add indaex for faster queries
    },
    messages: [
      {
        senderId: String,
        content: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isAdmin: Boolean,
        clientId: String, // Add clientId to each message
      },
    ],
  },
  { timestamps: true },
)

module.exports = mongoose.model("Chat", chatSchema)