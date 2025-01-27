const mongoose = require("mongoose")

const ContactFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    inquiryType: {
      type: String,
      required: true,
    },
    status: { type: String, enum: ["Active", "Non-active"], default: "Non-active" },
    archived: { type: Boolean, default: false }, // New field for archiving
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt
  },
)

module.exports = mongoose.model("ContactForm", ContactFormSchema)

