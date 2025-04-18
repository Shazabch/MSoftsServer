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
  status: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Invoice", InvoiceSchema);