// Import mongoose
const mongoose = require('mongoose');

// Define Support Ticket schema
const supportTicketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'Open' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, 
  }
);

// Create model
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

// Export model
module.exports = SupportTicket;
