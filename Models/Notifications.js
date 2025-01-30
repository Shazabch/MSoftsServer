const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    clientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Clients', // Reference to the Client model
      required: true 
    },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    clientName: { type: String, required: true },
    projectDescription: { type: String, required: true },
    message: { type: String, required: true },
    lastUpdate: { type: Date, required: true },
    progress: { type: Number, required: true }, // Assuming progress is a percentage (0-100)
    createdAt: { type: Date, default: Date.now },
    markAsRead: { type: Boolean, default: false }, // Field to track if the notification is read
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
