const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    projectDescription: { type: String, required: true },
    message: { type: String, required: true },
    lastUpdate: { type: Date, required: true },
    progress: { type: Number, required: true }, // Assuming progress is a percentage (0-100)
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
