const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String, required: true },
    projectName: { type: String, required: true },
    projectDescription: { type: String },
    projectType: {
      type: String,
      required: true,
      enum: ["Mobile App", "Web App", "Desktop App", "UI/UX Design", "SEO Service"], // Define allowed options
    },
    features: { type: [String] },
    budget: { type: String },
    deadline: { type: Date },
  },
  { timestamps: true } // Enables createdAt and updatedAt fields
);

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
