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

  features: { type: String, required: true }, 
  budget: { type: Number, required: true },   
  deadline: { type: Date, required: true },    
  daysRemaining: { type: Number },             
  progress: { type: Number, default: 0 },     
  lastUpdate: { type: Date, default: Date.now },
  description: { type: String, required: true }, 
});

module.exports = mongoose.model("clientProjects", projectSchema);
