const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clients",
    required: true,
  },
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bank",
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "clientProjects",
    required: true,
  },
  salesTax: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "InvoiceItem", // Reference to InvoiceItem collection
  }],
  createdAt: {
    type: Date,
    default: Date.now, // ✅ Automatically sets current date on creation
  },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
