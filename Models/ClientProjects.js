const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientId: { type: String, required: true }, // clientId as a String

  status: {
    type: String,
    enum: [
      "In Progress",
      "Review",
      "Completed",
      "On Hold",            // New status
      "Cancelled",          // New status
      "Under Analysis"      // New status
    ],
    default: "In Progress",
  },
  progress: { type: Number, default: 0 },
  lastUpdate: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model("ClientProject", projectSchema);
