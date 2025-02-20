const express = require("express")
const router = express.Router()
const Invoice = require('../Models/InvoiceModel');
const InvoiceItem = require("../Models/InvoiceItems")

// Get next invoice ID
router.get("/next-id", async (req, res) => {
  try {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}${month}${day}`

    const lastInvoice = await Invoice.findOne({
      invoiceId: new RegExp(`INVMAJ-${dateStr}-\\d{4}$`),
    }).sort({ invoiceId: -1 })

    let nextNumber = 1
    if (lastInvoice) {
      const lastNumber = Number.parseInt(lastInvoice.invoiceId.split("-")[2])
      nextNumber = lastNumber + 1
    }

    const nextInvoiceId = `INVMAJ-${dateStr}-${String(nextNumber).padStart(4, "0")}`
    res.json({ nextInvoiceId })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create a new invoice
router.post("/", async (req, res) => {
  try {
    const invoice = new Invoice(req.body)
    await invoice.save()

    const invoiceItems = req.body.items.map((item) => ({
      ...item,
      invoiceId: invoice.invoiceId,
    }))
    await InvoiceItem.insertMany(invoiceItems)

    res.status(201).json(invoice)
  } catch (error) {
    res.status(400).json({ message: error.message })
    console.log(error)
  }
})

// Get all invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find()
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get a specific invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: "Invoice not found" })

    const items = await InvoiceItem.find({ invoiceId: invoice.invoiceId })
    res.json({ ...invoice.toObject(), items })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update an invoice
router.patch("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!invoice) return res.status(404).json({ message: "Invoice not found" })

    await InvoiceItem.deleteMany({ invoiceId: invoice.invoiceId })
    const invoiceItems = req.body.items.map((item) => ({
      ...item,
      invoiceId: invoice.invoiceId,
    }))
    await InvoiceItem.insertMany(invoiceItems)

    res.json(invoice)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete an invoice
router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id)
    if (!invoice) return res.status(404).json({ message: "Invoice not found" })

    await InvoiceItem.deleteMany({ invoiceId: invoice.invoiceId })
    res.json({ message: "Invoice deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router

