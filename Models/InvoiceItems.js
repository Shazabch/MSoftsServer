const mongoose = require("mongoose")

const InvoiceItemSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  details: String,
})

module.exports = mongoose.model("InvoiceItem", InvoiceItemSchema)

