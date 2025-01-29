const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientId: { type: String, required: true }, // You can still keep clientId as a String or reference it using `ObjectId`

  status: {
    type: String,
    enum: [
      "In Progress",
      "Review",
      "Completed",
      "On Hold",            
      "Cancelled",          // New status
      "Under Analysis" ,
      "Starting Project"     // New status
    ],
    default: "In Progress",
  },

  features: { type: String, required: true },  // Store features (comma-separated)
  budget: { type: Number, required: true },    // Store budget
  deadline: { type: Date, required: true },    // Store deadline as Date
  daysRemaining: { type: Number },             // Dynamically calculated based on deadline
  progress: { type: Number, default: 0 },      // Track project progress
  lastUpdate: { type: Date, default: Date.now }, // Automatically set the last updated time
  description: { type: String, required: true }, // Store description
});

module.exports = mongoose.model("ClientProject", projectSchema);
